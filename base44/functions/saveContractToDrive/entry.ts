import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ROOT_FOLDER_NAME = "Datos de Cliente INVERSIONES CTEC";

async function getOrCreateFolder(authHeader, parentId, folderName) {
  const q = parentId
    ? `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false and '${parentId}' in parents`
    : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
    { headers: authHeader }
  );
  const data = await searchRes.json();
  if (data.files && data.files.length > 0) return data.files[0].id;

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { ...authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {}),
    }),
  });
  const created = await createRes.json();
  return created.id;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    const { client_id, client_name, html_content, file_name } = body;
    if (!html_content) {
      return Response.json({ error: 'html_content es requerido' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Obtener o crear carpeta del cliente
    let parentFolderId = null;
    if (client_id) {
      const clients = await base44.asServiceRole.entities.Client.filter({ id: client_id });
      if (clients.length > 0 && clients[0].drive_folder_id) {
        parentFolderId = clients[0].drive_folder_id;
      }
    }

    if (!parentFolderId && client_id && client_name) {
      const rootFolderId = await getOrCreateFolder(authHeader, null, ROOT_FOLDER_NAME);
      parentFolderId = await getOrCreateFolder(authHeader, rootFolderId, client_name);
      await base44.asServiceRole.entities.Client.update(client_id, { drive_folder_id: parentFolderId });
    }

    const baseName = (file_name || `Contrato_${client_name}_${new Date().toISOString().split('T')[0]}`).replace(/\.html$/, '');

    // 1. Subir HTML como Google Doc
    const boundary = 'boundary_ctec';
    const metadata = {
      name: `_temp_${baseName}`,
      mimeType: 'application/vnd.google-apps.document',
      ...(parentFolderId ? { parents: [parentFolderId] } : {}),
    };
    const multiBody = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: text/html\r\n\r\n${html_content}\r\n--${boundary}--`;

    const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': `multipart/related; boundary=${boundary}` },
      body: multiBody,
    });
    const tempDoc = await uploadRes.json();
    if (!tempDoc.id) throw new Error('No se pudo crear el doc temporal');

    // 2. Exportar como PDF
    const pdfRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${tempDoc.id}/export?mimeType=application/pdf`,
      { headers: authHeader }
    );
    if (!pdfRes.ok) throw new Error(`Export PDF failed: ${pdfRes.status}`);
    const pdfBytes = await pdfRes.arrayBuffer();
    const pdfArray = new Uint8Array(pdfBytes);

    // 3. Subir el PDF
    const pdfBoundary = 'boundary_pdf';
    const pdfMeta = JSON.stringify({
      name: `${baseName}.pdf`,
      mimeType: 'application/pdf',
      ...(parentFolderId ? { parents: [parentFolderId] } : {}),
    });
    const encoder = new TextEncoder();
    const part1 = encoder.encode(`--${pdfBoundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${pdfMeta}\r\n--${pdfBoundary}\r\nContent-Type: application/pdf\r\n\r\n`);
    const part2 = encoder.encode(`\r\n--${pdfBoundary}--`);
    const combined = new Uint8Array(part1.length + pdfArray.length + part2.length);
    combined.set(part1, 0);
    combined.set(pdfArray, part1.length);
    combined.set(part2, part1.length + pdfArray.length);

    const pdfUploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': `multipart/related; boundary=${pdfBoundary}` },
      body: combined,
    });
    const pdfFile = await pdfUploadRes.json();

    // 4. Eliminar doc temporal
    await fetch(`https://www.googleapis.com/drive/v3/files/${tempDoc.id}`, {
      method: 'DELETE',
      headers: authHeader,
    });

    return Response.json({
      success: true,
      file_id: pdfFile.id,
      file_name: `${baseName}.pdf`,
    });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});