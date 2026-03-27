import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_69b62672be45da00af3df17b/0d96f8146_LogodeinversionesCTEC.png";
const ROOT_FOLDER_NAME = "Datos de Cliente INVERSIONES CTEC";
const TL = { daily: 'Diario', weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };

function fmtL(n) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n || 0);
}

function generateContractHtml(loan, client) {
  const rows = (loan.payment_schedule || []).map(s =>
    `<tr><td style="padding:6px 10px;text-align:center;color:#555;">${s.installment_number}</td><td style="padding:6px 10px;text-align:center;color:#333;">${s.due_date}</td><td style="padding:6px 10px;text-align:right;color:#333;">RD$ ${Number(s.amount).toFixed(2)}</td></tr>`
  ).join('');

  const secTitle = (t) => `<div style="color:#d4a533;font-size:11px;font-weight:bold;text-transform:uppercase;border-bottom:2px solid #d4a533;padding-bottom:4px;margin-bottom:10px;">${t}</div>`;
  const row2 = (l1,v1,l2,v2) => `<div style="display:grid;grid-template-columns:1fr 1fr;margin-bottom:6px;"><div style="display:flex;padding:5px 8px;"><span style="color:#888;font-size:10px;flex:1;">${l1}</span><span style="font-weight:700;font-size:10px;">${v1}</span></div><div style="display:flex;padding:5px 8px;"><span style="color:#888;font-size:10px;flex:1;">${l2}</span><span style="font-weight:700;font-size:10px;text-align:right;">${v2}</span></div></div>`;

  return `<html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#1a1a1a;padding:24px 28px;font-size:11px}</style></head><body>
    <div style="display:flex;align-items:center;gap:14px;border-bottom:3px solid #d4a533;padding-bottom:12px;margin-bottom:18px;">
      <img src="${LOGO_URL}" style="width:60px;height:60px;object-fit:contain;"/>
      <div><div style="color:#d4a533;font-size:22px;font-weight:bold;">INVERSIONES CTEC</div><div style="color:#666;font-size:10px;">Servicios Financieros &middot; Rep&uacute;blica Dominicana</div></div>
      <div style="margin-left:auto;font-size:10px;color:#888;">Fecha: ${new Date().toLocaleDateString('es-DO')}</div>
    </div>
    <div style="border:1px solid #ccc;border-radius:6px;padding:10px 16px;text-align:center;font-size:14px;font-weight:bold;color:#333;margin-bottom:18px;">&#128196; CONTRATO DE PR&Eacute;STAMO</div>
    <div style="margin-bottom:14px;">
      ${secTitle('Datos del Cliente')}
      ${row2('Nombre:', `${client?.first_name||''} ${client?.last_name||''}`, 'C&eacute;dula / ID:', client?.id_number||'&mdash;')}
      ${row2('Tel&eacute;fono:', client?.phone||'&mdash;', 'Direcci&oacute;n:', client?.address||'&mdash;')}
    </div>
    <div style="margin-bottom:14px;">
      ${secTitle('Condiciones del Pr&eacute;stamo')}
      ${row2('Monto Prestado:', fmtL(loan.amount), 'Tasa de Inter&eacute;s:', `${loan.interest_rate}% ${TL[loan.interest_type]||''}`)}
      ${row2('N&uacute;mero de Cuotas:', loan.num_installments, 'Valor por Cuota:', fmtL(loan.installment_amount))}
      ${row2('Fecha de Inicio:', loan.start_date, 'Fecha de Vencimiento:', loan.due_date||'&mdash;')}
      ${row2('Inter&eacute;s por Mora:', `${loan.late_interest}%`, 'D&iacute;as de Gracia:', `${loan.grace_days} d&iacute;as`)}
    </div>
    <div style="border:2px solid #d4a533;border-radius:6px;padding:12px;margin-bottom:18px;display:grid;grid-template-columns:1fr 1fr 1fr;text-align:center;">
      <div><div style="font-size:10px;color:#888;margin-bottom:4px;">Capital</div><div style="font-size:16px;font-weight:bold;color:#3b82f6;">${fmtL(loan.amount)}</div></div>
      <div><div style="font-size:10px;color:#888;margin-bottom:4px;">Inter&eacute;s Total</div><div style="font-size:16px;font-weight:bold;color:#d4a533;">${fmtL(loan.total_interest)}</div></div>
      <div><div style="font-size:10px;color:#888;margin-bottom:4px;">TOTAL A PAGAR</div><div style="font-size:16px;font-weight:bold;color:#10b981;">${fmtL(loan.total_to_pay)}</div></div>
    </div>
    <div style="margin-bottom:18px;">
      ${secTitle('Calendario de Pagos')}
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead><tr><th style="padding:6px 10px;text-align:center;color:#888;font-weight:600;border-bottom:1px solid #eee;">#</th><th style="padding:6px 10px;text-align:center;color:#888;font-weight:600;border-bottom:1px solid #eee;">Fecha de Vencimiento</th><th style="padding:6px 10px;text-align:right;color:#888;font-weight:600;border-bottom:1px solid #eee;">Monto</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:20px;margin-bottom:20px;">
      <div style="text-align:center;border-top:1px solid #999;padding-top:6px;font-size:10px;color:#555;">Firma del Prestatario<br/>${client?.first_name||''} ${client?.last_name||''}</div>
      <div style="text-align:center;border-top:1px solid #999;padding-top:6px;font-size:10px;color:#555;">Firma Inversiones CTEC<br/>Autorizado</div>
    </div>
    <div style="text-align:center;border-top:3px solid #d4a533;padding-top:10px;font-size:10px;color:#888;"><strong>INVERSIONES CTEC</strong> &mdash; Tel: 809-462-2360</div>
  </body></html>`;
}

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

async function saveContractPdf(authHeader, folderId, baseName, htmlContent) {
  const boundary = 'boundary_ctec';
  const tempMeta = JSON.stringify({
    name: `_temp_${baseName}`,
    mimeType: 'application/vnd.google-apps.document',
    parents: [folderId],
  });
  const multiBody = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${tempMeta}\r\n--${boundary}\r\nContent-Type: text/html\r\n\r\n${htmlContent}\r\n--${boundary}--`;

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { ...authHeader, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: multiBody,
  });
  const tempDoc = await uploadRes.json();
  if (!tempDoc.id) throw new Error('No se pudo crear el doc temporal');

  const pdfRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${tempDoc.id}/export?mimeType=application/pdf`,
    { headers: authHeader }
  );
  if (!pdfRes.ok) throw new Error(`Export PDF failed: ${pdfRes.status}`);
  const pdfBytes = await pdfRes.arrayBuffer();
  const pdfArray = new Uint8Array(pdfBytes);

  const pdfBoundary = 'boundary_pdf';
  const pdfMeta = JSON.stringify({ name: `${baseName}.pdf`, mimeType: 'application/pdf', parents: [folderId] });
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

  // Eliminar doc temporal
  await fetch(`https://www.googleapis.com/drive/v3/files/${tempDoc.id}`, {
    method: 'DELETE',
    headers: authHeader,
  });

  return pdfFile;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    // Recibe el loan desde el payload de la automatización
    const loan = body.data;
    if (!loan || !loan.client_id) {
      return Response.json({ error: 'No hay datos del préstamo' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Obtener cliente
    const clients = await base44.asServiceRole.entities.Client.filter({ id: loan.client_id });
    const client = clients[0];
    if (!client) {
      return Response.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Obtener o crear carpeta raíz y del cliente
    const rootFolderId = await getOrCreateFolder(authHeader, null, ROOT_FOLDER_NAME);

    let clientFolderId = client.drive_folder_id;
    if (!clientFolderId) {
      const folderName = `${client.first_name} ${client.last_name}`;
      clientFolderId = await getOrCreateFolder(authHeader, rootFolderId, folderName);
      await base44.asServiceRole.entities.Client.update(client.id, { drive_folder_id: clientFolderId });
    }

    const html = generateContractHtml(loan, client);
    const baseName = `Contrato_${client.first_name}_${client.last_name}_${loan.start_date || new Date().toISOString().split('T')[0]}`;

    const pdfFile = await saveContractPdf(authHeader, clientFolderId, baseName, html);
    console.log(`Contrato guardado automáticamente: ${baseName}.pdf — ID: ${pdfFile.id}`);

    return Response.json({ success: true, file_id: pdfFile.id, file_name: `${baseName}.pdf` });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});