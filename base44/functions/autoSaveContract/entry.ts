import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_69b62672be45da00af3df17b/0d96f8146_LogodeinversionesCTEC.png";
const ROOT_FOLDER_NAME = "Datos de Cliente INVERSIONES CTEC";
const TL = { daily: 'Diario', weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };

function fmtL(n) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n || 0);
}

function generateContractHtml(loan, client) {
  const rows = (loan.payment_schedule || []).map(s =>
    `<tr><td style="padding:3px 6px;border-bottom:1px solid #f0f0f0;text-align:center;">${s.installment_number}</td><td style="padding:3px 6px;border-bottom:1px solid #f0f0f0;text-align:center;">${s.due_date}</td><td style="padding:3px 6px;border-bottom:1px solid #f0f0f0;text-align:right;">RD$ ${Number(s.amount).toFixed(2)}</td></tr>`
  ).join('');

  return `<html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#1a1a1a;padding:14px 20px;font-size:11px}.hdr{display:flex;align-items:center;gap:12px;border-bottom:3px solid #d4a533;padding-bottom:8px;margin-bottom:10px}.logo{width:52px;height:52px;object-fit:contain}.ttl{text-align:center;font-size:13px;font-weight:bold;color:#333;background:#f9f5ec;padding:6px;border-radius:4px;margin-bottom:10px;border:1px solid #e8d89a}.sec{margin-bottom:10px}.sec-t{font-size:10px;font-weight:bold;color:#d4a533;text-transform:uppercase;border-bottom:1px solid #e8d89a;padding-bottom:2px;margin-bottom:6px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:4px}.item{display:flex;justify-content:space-between;padding:4px 8px;background:#f9f9f9;border-radius:3px}.item span:first-child{color:#666}.item span:last-child{font-weight:600}.box{background:linear-gradient(135deg,#fffbf0,#fff8e6);border:2px solid #d4a533;border-radius:6px;padding:8px;margin-bottom:10px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center}table{width:100%;border-collapse:collapse;font-size:11px}thead tr{background:#d4a533;color:#fff}thead th{padding:5px;text-align:center}tbody tr:nth-child(even){background:#fafafa}.sigs{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:16px}.sig{text-align:center;border-top:1px solid #999;padding-top:4px;color:#555;font-size:10px}.ftr{text-align:center;margin-top:12px;padding-top:8px;border-top:2px solid #d4a533;color:#888;font-size:10px}</style></head><body>
    <div class="hdr"><img src="${LOGO_URL}" class="logo"/><div><div style="color:#d4a533;font-size:18px;font-weight:bold;">INVERSIONES CTEC</div><div style="color:#555;font-size:10px;">Servicios Financieros &middot; Rep&uacute;blica Dominicana</div></div><div style="margin-left:auto;text-align:right;font-size:10px;color:#888;">Fecha: ${new Date().toLocaleDateString('es-DO')}</div></div>
    <div class="ttl">&#128196; CONTRATO DE PR&Eacute;STAMO</div>
    <div class="sec"><div class="sec-t">Datos del Cliente</div><div class="grid"><div class="item"><span>Nombre:</span><span>${client?.first_name || ''} ${client?.last_name || ''}</span></div><div class="item"><span>C&eacute;dula / ID:</span><span>${client?.id_number || '&mdash;'}</span></div><div class="item"><span>Tel&eacute;fono:</span><span>${client?.phone || '&mdash;'}</span></div><div class="item"><span>Direcci&oacute;n:</span><span>${client?.address || '&mdash;'}</span></div></div></div>
    <div class="sec"><div class="sec-t">Condiciones del Pr&eacute;stamo</div><div class="grid"><div class="item"><span>Monto Prestado:</span><span>${fmtL(loan.amount)}</span></div><div class="item"><span>Tasa de Inter&eacute;s:</span><span>${loan.interest_rate}% ${TL[loan.interest_type] || ''}</span></div><div class="item"><span>N&uacute;mero de Cuotas:</span><span>${loan.num_installments}</span></div><div class="item"><span>Valor por Cuota:</span><span>${fmtL(loan.installment_amount)}</span></div><div class="item"><span>Fecha de Inicio:</span><span>${loan.start_date}</span></div><div class="item"><span>Fecha de Vencimiento:</span><span>${loan.due_date || '&mdash;'}</span></div><div class="item"><span>Inter&eacute;s por Mora:</span><span>${loan.late_interest}%</span></div><div class="item"><span>D&iacute;as de Gracia:</span><span>${loan.grace_days} d&iacute;as</span></div></div></div>
    <div class="box"><div><p style="color:#888;font-size:10px;">Capital</p><p style="font-size:14px;font-weight:bold;color:#3b82f6;">${fmtL(loan.amount)}</p></div><div><p style="color:#888;font-size:10px;">Inter&eacute;s Total</p><p style="font-size:14px;font-weight:bold;color:#d4a533;">${fmtL(loan.total_interest)}</p></div><div><p style="color:#888;font-size:10px;">TOTAL A PAGAR</p><p style="font-size:14px;font-weight:bold;color:#10b981;">${fmtL(loan.total_to_pay)}</p></div></div>
    <div class="sec"><div class="sec-t">Calendario de Pagos</div><table><thead><tr><th>#</th><th>Fecha de Vencimiento</th><th>Monto</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="sigs"><div class="sig">Firma del Prestatario<br/>${client?.first_name || ''} ${client?.last_name || ''}</div><div class="sig">Firma Inversiones CTEC<br/>Autorizado</div></div>
    <div class="ftr"><strong>INVERSIONES CTEC</strong> &mdash; Tel: 809-462-2360</div>
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

    // Crear registro en la entidad Contract
    await base44.asServiceRole.entities.Contract.create({
      loan_id: loan.id,
      client_id: loan.client_id,
      client_name: loan.client_name,
      loan_amount: loan.amount,
      total_to_pay: loan.total_to_pay,
      start_date: loan.start_date,
      due_date: loan.due_date,
      interest_rate: loan.interest_rate,
      interest_type: loan.interest_type,
      num_installments: loan.num_installments,
      printed_at: new Date().toISOString().split('T')[0],
    });

    return Response.json({ success: true, file_id: pdfFile.id, file_name: `${baseName}.pdf` });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});