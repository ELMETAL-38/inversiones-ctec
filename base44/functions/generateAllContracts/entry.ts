import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_69b62672be45da00af3df17b/0d96f8146_LogodeinversionesCTEC.png";
const ROOT_FOLDER_NAME = "Datos de Cliente INVERSIONES CTEC";
const TL = { daily: 'Diario', weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };

function fmtL(n) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n || 0);
}

function generateContractHtml(loan, client) {
  const rows = (loan.payment_schedule || []).map(s =>
    `<tr><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:center;">${s.installment_number}</td><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:center;">${s.due_date}</td><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:right;">RD$ ${Number(s.amount).toFixed(2)}</td></tr>`
  ).join('');

  return `<html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#1a1a1a;padding:30px;font-size:13px}.hdr{display:flex;align-items:center;gap:16px;border-bottom:3px solid #d4a533;padding-bottom:16px;margin-bottom:20px}.logo{width:70px;height:70px;object-fit:contain}.ttl{text-align:center;font-size:16px;font-weight:bold;color:#333;background:#f9f5ec;padding:10px;border-radius:6px;margin-bottom:20px;border:1px solid #e8d89a}.sec{margin-bottom:20px}.sec-t{font-size:12px;font-weight:bold;color:#d4a533;text-transform:uppercase;border-bottom:1px solid #e8d89a;padding-bottom:4px;margin-bottom:10px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.item{display:flex;justify-content:space-between;padding:6px 10px;background:#f9f9f9;border-radius:4px}.item span:first-child{color:#666}.item span:last-child{font-weight:600}.box{background:linear-gradient(135deg,#fffbf0,#fff8e6);border:2px solid #d4a533;border-radius:8px;padding:16px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center}table{width:100%;border-collapse:collapse;font-size:12px}thead tr{background:#d4a533;color:#fff}thead th{padding:8px;text-align:center}tbody tr:nth-child(even){background:#fafafa}.sigs{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:30px}.sig{text-align:center;border-top:1px solid #999;padding-top:6px;color:#555;font-size:11px}.ftr{text-align:center;margin-top:24px;padding-top:14px;border-top:2px solid #d4a533;color:#888;font-size:11px}</style></head><body>
    <div class="hdr"><img src="${LOGO_URL}" class="logo"/><div><div style="color:#d4a533;font-size:22px;font-weight:bold;">INVERSIONES CTEC</div><div style="color:#555;font-size:11px;">Servicios Financieros &middot; Rep&uacute;blica Dominicana</div></div><div style="margin-left:auto;text-align:right;font-size:11px;color:#888;">Fecha: ${new Date().toLocaleDateString('es-DO')}</div></div>
    <div class="ttl">&#128196; CONTRATO DE PR&Eacute;STAMO</div>
    <div class="sec"><div class="sec-t">Datos del Cliente</div><div class="grid"><div class="item"><span>Nombre:</span><span>${client?.first_name || ''} ${client?.last_name || ''}</span></div><div class="item"><span>C&eacute;dula / ID:</span><span>${client?.id_number || '&mdash;'}</span></div><div class="item"><span>Tel&eacute;fono:</span><span>${client?.phone || '&mdash;'}</span></div><div class="item"><span>Direcci&oacute;n:</span><span>${client?.address || '&mdash;'}</span></div></div></div>
    <div class="sec"><div class="sec-t">Condiciones del Pr&eacute;stamo</div><div class="grid"><div class="item"><span>Monto Prestado:</span><span>${fmtL(loan.amount)}</span></div><div class="item"><span>Tasa de Inter&eacute;s:</span><span>${loan.interest_rate}% ${TL[loan.interest_type] || ''}</span></div><div class="item"><span>N&uacute;mero de Cuotas:</span><span>${loan.num_installments}</span></div><div class="item"><span>Valor por Cuota:</span><span>${fmtL(loan.installment_amount)}</span></div><div class="item"><span>Fecha de Inicio:</span><span>${loan.start_date}</span></div><div class="item"><span>Fecha de Vencimiento:</span><span>${loan.due_date || '&mdash;'}</span></div><div class="item"><span>Inter&eacute;s por Mora:</span><span>${loan.late_interest}%</span></div><div class="item"><span>D&iacute;as de Gracia:</span><span>${loan.grace_days} d&iacute;as</span></div></div></div>
    <div class="box"><div><p style="color:#888;font-size:11px;">Capital</p><p style="font-size:17px;font-weight:bold;color:#3b82f6;">${fmtL(loan.amount)}</p></div><div><p style="color:#888;font-size:11px;">Inter&eacute;s Total</p><p style="font-size:17px;font-weight:bold;color:#d4a533;">${fmtL(loan.total_interest)}</p></div><div><p style="color:#888;font-size:11px;">TOTAL A PAGAR</p><p style="font-size:17px;font-weight:bold;color:#10b981;">${fmtL(loan.total_to_pay)}</p></div></div>
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

async function uploadHtmlAsGoogleDoc(authHeader, folderId, fileName, htmlContent) {
  const boundary = 'boundary_ctec';
  const metadata = {
    name: fileName,
    mimeType: 'application/vnd.google-apps.document',
    parents: [folderId],
  };
  const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: text/html\r\n\r\n${htmlContent}\r\n--${boundary}--`;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { ...authHeader, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  return await res.json();
}

async function exportDocAsPdf(authHeader, docId) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=application/pdf`,
    { headers: authHeader }
  );
  if (!res.ok) throw new Error(`Export PDF failed: ${res.status}`);
  return await res.arrayBuffer();
}

async function uploadPdfToFolder(authHeader, folderId, fileName, pdfBytes) {
  const boundary = 'boundary_pdf';
  const metadata = {
    name: fileName,
    mimeType: 'application/pdf',
    parents: [folderId],
  };
  const metadataPart = JSON.stringify(metadata);
  const pdfArray = new Uint8Array(pdfBytes);

  // Multipart body with binary PDF
  const encoder = new TextEncoder();
  const part1 = encoder.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadataPart}\r\n--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`);
  const part2 = encoder.encode(`\r\n--${boundary}--`);

  const combined = new Uint8Array(part1.length + pdfArray.length + part2.length);
  combined.set(part1, 0);
  combined.set(pdfArray, part1.length);
  combined.set(part2, part1.length + pdfArray.length);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { ...authHeader, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: combined,
  });
  return await res.json();
}

async function deleteFile(authHeader, fileId) {
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: authHeader,
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    const [loans, clients] = await Promise.all([
      base44.asServiceRole.entities.Loan.list(),
      base44.asServiceRole.entities.Client.list(),
    ]);

    const clientMap = {};
    clients.forEach(c => { clientMap[c.id] = c; });

    const rootFolderId = await getOrCreateFolder(authHeader, null, ROOT_FOLDER_NAME);
    console.log('Root folder:', rootFolderId);

    let success = 0;
    let failed = 0;

    for (const loan of loans) {
      try {
        const client = clientMap[loan.client_id];
        if (!client) { failed++; continue; }

        let clientFolderId = client.drive_folder_id;
        if (!clientFolderId) {
          const folderName = `${client.first_name} ${client.last_name}`;
          clientFolderId = await getOrCreateFolder(authHeader, rootFolderId, folderName);
          await base44.asServiceRole.entities.Client.update(client.id, { drive_folder_id: clientFolderId });
          clientMap[client.id] = { ...client, drive_folder_id: clientFolderId };
        }

        const html = generateContractHtml(loan, client);
        const baseName = `Contrato_${client.first_name}_${client.last_name}_${loan.start_date || 'sin-fecha'}`;

        // 1. Subir como Google Doc (convierte el HTML)
        const tempDoc = await uploadHtmlAsGoogleDoc(authHeader, clientFolderId, `_temp_${baseName}`, html);
        if (!tempDoc.id) throw new Error('No se pudo crear el doc temporal');

        // 2. Exportar como PDF
        const pdfBytes = await exportDocAsPdf(authHeader, tempDoc.id);

        // 3. Subir el PDF
        await uploadPdfToFolder(authHeader, clientFolderId, `${baseName}.pdf`, pdfBytes);

        // 4. Eliminar el doc temporal
        await deleteFile(authHeader, tempDoc.id);

        success++;
        console.log(`PDF generado: ${baseName}.pdf`);
      } catch (err) {
        console.error(`Error en préstamo ${loan.id}:`, err.message);
        failed++;
      }
    }

    return Response.json({ success, failed, total: loans.length });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});