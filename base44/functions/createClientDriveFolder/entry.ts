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
    const authHeader = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // Buscar carpeta raíz previamente creada por la app (drive.file scope puede encontrar las que creó la app)
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name%3D'${encodeURIComponent(ROOT_FOLDER_NAME)}'%20and%20mimeType%3D'application%2Fvnd.google-apps.folder'%20and%20trashed%3Dfalse&fields=files(id%2Cname)`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const searchData = await searchRes.json();
    console.log('Search result:', JSON.stringify(searchData));

    let rootFolderId;
    if (searchData.files && searchData.files.length > 0) {
      rootFolderId = searchData.files[0].id;
      console.log('Root folder found:', rootFolderId);
    } else {
      // Crear carpeta raíz
      const createRootRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          name: ROOT_FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });
      const rootData = await createRootRes.json();
      rootFolderId = rootData.id;
      console.log('Root folder created:', rootFolderId);
    }

    // Crear subcarpeta con el nombre del cliente
    const createClientRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        name: client_name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [rootFolderId],
      }),
    });
    const clientFolderData = await createClientRes.json();
    console.log('Client folder created:', JSON.stringify(clientFolderData));

    if (!clientFolderData.id) {
      return Response.json({ error: 'No se pudo crear la carpeta', detail: clientFolderData }, { status: 500 });
    }

    // Guardar el folder ID en el cliente
    await base44.asServiceRole.entities.Client.update(client_id, {
      drive_folder_id: clientFolderData.id,
    });

    return Response.json({
      success: true,
      folder_id: clientFolderData.id,
      folder_name: client_name,
    });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});