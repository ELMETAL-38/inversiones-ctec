import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ROOT_FOLDER_NAME = "Datos de Cliente INVERSIONES CTEC";

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    const { client_id, client_name } = body;
    if (!client_id || !client_name) {
      return Response.json({ error: 'client_id y client_name son requeridos' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Buscar si ya existe la carpeta raíz creada por la app
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${ROOT_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const searchData = await searchRes.json();

    let rootFolderId;
    if (searchData.files && searchData.files.length > 0) {
      rootFolderId = searchData.files[0].id;
    } else {
      // Crear carpeta raíz
      const createRoot = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          name: ROOT_FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });
      const rootData = await createRoot.json();
      rootFolderId = rootData.id;
    }

    // Crear subcarpeta con el nombre del cliente
    const createClientFolder = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        name: client_name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [rootFolderId],
      }),
    });
    const clientFolderData = await createClientFolder.json();

    // Guardar el folder ID en el cliente
    await base44.asServiceRole.entities.Client.update(client_id, {
      drive_folder_id: clientFolderData.id,
    });

    return Response.json({ 
      success: true, 
      folder_id: clientFolderData.id,
      folder_name: client_name
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});