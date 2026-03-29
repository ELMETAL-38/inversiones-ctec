import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    const contracts = await base44.asServiceRole.entities.Contract.list();
    
    if (contracts.length === 0) {
      return Response.json({ error: 'No hay contratos para descargar' }, { status: 400 });
    }

    // Crear archivo ZIP en memoria usando un Blob simple
    const files = [];
    
    for (const contract of contracts) {
      try {
        // Buscar el archivo PDF en Drive
        const q = `name contains '${contract.client_name}' and name contains 'Contrato' and mimeType='application/pdf' and trashed=false`;
        const searchRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1`,
          { headers: authHeader }
        );
        const searchData = await searchRes.json();
        
        if (searchData.files && searchData.files.length > 0) {
          const file = searchData.files[0];
          const downloadRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
            { headers: authHeader }
          );
          
          if (downloadRes.ok) {
            const buffer = await downloadRes.arrayBuffer();
            files.push({
              name: file.name,
              data: new Uint8Array(buffer)
            });
          }
        }
      } catch (err) {
        console.error(`Error descargando contrato ${contract.id}:`, err.message);
      }
    }

    if (files.length === 0) {
      return Response.json({ error: 'No se pudieron descargar los archivos' }, { status: 400 });
    }

    // Crear ZIP simple (formato muy básico pero funcional)
    const zip = createZip(files);
    
    return new Response(zip, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename=contratos-${new Date().getTime()}.zip`
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function createZip(files) {
  const centralDir = [];
  const fileDataArray = [];
  let offset = 0;

  // Crear cada archivo en el ZIP
  files.forEach((file, idx) => {
    const fileData = createLocalFileHeader(file.name, file.data, offset);
    fileDataArray.push(fileData);
    offset += fileData.length;
    centralDir.push(createCentralDirHeader(file.name, file.data, offset - fileData.length));
  });

  // Combinar todo
  const fileDataBuffer = new Uint8Array(fileDataArray.reduce((acc, arr) => acc + arr.length, 0));
  let pos = 0;
  fileDataArray.forEach(arr => {
    fileDataBuffer.set(arr, pos);
    pos += arr.length;
  });

  const centralDirBuffer = new Uint8Array(centralDir.reduce((acc, arr) => acc + arr.length, 0));
  pos = 0;
  centralDir.forEach(arr => {
    centralDirBuffer.set(arr, pos);
    pos += arr.length;
  });

  const eocdRecord = createEndOfCentralDirRecord(centralDir.length, centralDirBuffer.length, offset);

  const totalSize = fileDataBuffer.length + centralDirBuffer.length + eocdRecord.length;
  const result = new Uint8Array(totalSize);
  pos = 0;
  result.set(fileDataBuffer, pos);
  pos += fileDataBuffer.length;
  result.set(centralDirBuffer, pos);
  pos += centralDirBuffer.length;
  result.set(eocdRecord, pos);

  return result;
}

function createLocalFileHeader(filename, data, offset) {
  const filenameBytes = new TextEncoder().encode(filename);
  const header = new Uint8Array(30 + filenameBytes.length);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint16(14, 0, true);
  view.setUint32(16, 0, true);
  view.setUint32(20, data.length, true);
  view.setUint32(24, data.length, true);
  view.setUint16(26, filenameBytes.length, true);
  view.setUint16(28, 0, true);

  header.set(filenameBytes, 30);
  const combined = new Uint8Array(header.length + data.length);
  combined.set(header);
  combined.set(data, header.length);
  return combined;
}

function createCentralDirHeader(filename, data, offset) {
  const filenameBytes = new TextEncoder().encode(filename);
  const header = new Uint8Array(46 + filenameBytes.length);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint16(14, 0, true);
  view.setUint32(16, 0, true);
  view.setUint32(20, data.length, true);
  view.setUint32(24, data.length, true);
  view.setUint16(28, filenameBytes.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, offset, true);

  header.set(filenameBytes, 46);
  return header;
}

function createEndOfCentralDirRecord(fileCount, centralDirSize, centralDirOffset) {
  const record = new Uint8Array(22);
  const view = new DataView(record.buffer);

  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, fileCount, true);
  view.setUint16(10, fileCount, true);
  view.setUint32(12, centralDirSize, true);
  view.setUint32(16, centralDirOffset, true);
  view.setUint16(20, 0, true);

  return record;
}