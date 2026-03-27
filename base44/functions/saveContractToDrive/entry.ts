import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ROOT_FOLDER_NAME = "Datos de Cliente INVERSIONES CTEC";

async function getOrCreateFolder(authHeader, parentId, folderName) {
  const q = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentId ? ` and '${parentId}' in parents` : ''}`;
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

async function uploadAsPdf(authHeader, folderId, fileName, htmlContent) {
  const boundary = 'boundary_ctec';

  // 1. Subir HTML como Google Doc
  const docMetadata = { name: fileName, mimeType: 'application/vnd.google-apps.document' };
  const uploadBody = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(docMetadata)}\r\n--${boundary}\r\nContent-Type: text/html\r\n\r\n${htmlContent}\r\n--${boundary}--`;

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { ...authHeader, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: uploadBody,
  });
  const docData = await uploadRes.json();
  const docId = docData.id;

  // 2. Exportar como PDF
  const exportRes = await fetch(`https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=application/pdf`, {
    headers: authHeader,
  });
  const pdfBuffer = await exportRes.arrayBuffer();

  // 3. Subir PDF a carpeta del cliente
  const pdfFileName = `${fileName}.pdf`;
  const pdfMetadata = { name: pdfFileName, mimeType: 'application/pdf', parents: [folderId] };
  const pdfBody = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(pdfMetadata)}\r\n--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`;
  const encoder = new TextEncoder();
  const pdfBodyStart = encoder.encode(pdfBody);
  const pdfBodyEnd = encoder.encode(`\r\n--${boundary}--`);
  const combined = new Uint8Array(pdfBodyStart.length + pdfBuffer.byteLength + pdfBodyEnd.length);
  combined.set(pdfBodyStart, 0);
  combined.set(new Uint8Array(pdfBuffer), pdfBodyStart.length);
  combined.set(pdfBodyEnd, pdfBodyStart.length + pdfBuffer.byteLength);

  const pdfUploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { ...authHeader, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: combined,
  });
  const pdfData = await pdfUploadRes.json();

  // 4. Borrar el Google Doc temporal
  await fetch(`https://www.googleapis.com/drive/v3/files/${docId}`, {
    method: 'DELETE',
    headers: authHeader,
  });

  return pdfData;
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

    // Obtener o crear carpeta raíz
    const rootFolderId = await getOrCreateFolder(authHeader, null, ROOT_FOLDER_NAME);

    // Obtener o crear carpeta del cliente
    let clientFolderId = null;
    if (client_id) {
      const clients = await base44.asServiceRole.entities.Client.filter({ id: client_id });
      if (clients.length > 0 && clients[0].drive_folder_id) {
        clientFolderId = clients[0].drive_folder_id;
      }
    }
    if (!clientFolderId && client_name) {
      clientFolderId = await getOrCreateFolder(authHeader, rootFolderId, client_name);
      if (client_id) {
        await base44.asServiceRole.entities.Client.update(client_id, { drive_folder_id: clientFolderId });
      }
    }

    const baseName = (file_name || `Contrato_${client_name}_${new Date().toISOString().split('T')[0]}`).replace(/\.html$/, '');
    const pdfData = await uploadAsPdf(authHeader, clientFolderId || rootFolderId, baseName, html_content);

    return Response.json({
      success: true,
      file_id: pdfData.id,
      file_name: `${baseName}.pdf`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});