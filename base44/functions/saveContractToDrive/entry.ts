import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

    // Obtener el folder_id del cliente si existe
    let parentFolderId = null;
    if (client_id) {
      const clients = await base44.asServiceRole.entities.Client.filter({ id: client_id });
      if (clients.length > 0 && clients[0].drive_folder_id) {
        parentFolderId = clients[0].drive_folder_id;
      }
    }

    // Si no tiene carpeta, crearla
    if (!parentFolderId && client_id && client_name) {
      const ROOT_FOLDER_NAME = "Datos de Cliente INVERSIONES CTEC";
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${ROOT_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
        { headers: authHeader }
      );
      const searchData = await searchRes.json();
      let rootFolderId;
      if (searchData.files && searchData.files.length > 0) {
        rootFolderId = searchData.files[0].id;
      } else {
        const createRoot = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: { ...authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: ROOT_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
        });
        rootFolderId = (await createRoot.json()).id;
      }
      const createFolder = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: client_name, mimeType: 'application/vnd.google-apps.folder', parents: [rootFolderId] }),
      });
      const folderData = await createFolder.json();
      parentFolderId = folderData.id;
      await base44.asServiceRole.entities.Client.update(client_id, { drive_folder_id: parentFolderId });
    }

    // Subir el archivo HTML como documento
    const fileName = file_name || `Contrato_${client_name}_${new Date().toISOString().split('T')[0]}.html`;
    const metadata = {
      name: fileName,
      mimeType: 'text/html',
      ...(parentFolderId ? { parents: [parentFolderId] } : {}),
    };

    const boundary = 'boundary_ctec_drive';
    const multipartBody = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: text/html\r\n\r\n${html_content}\r\n--${boundary}--`;

    const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    });
    const uploadData = await uploadRes.json();

    return Response.json({ 
      success: true, 
      file_id: uploadData.id,
      file_name: fileName
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});