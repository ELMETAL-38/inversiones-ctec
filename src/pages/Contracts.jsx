import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, Printer, Eye, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

const TYPE_LABELS = { daily: 'Diario', weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };
const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_69b62672be45da00af3df17b/0d96f8146_LogodeinversionesCTEC.png";

export default function Contracts() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.Contract.list('-created_date', 500),
  });

  const { data: loans = [] } = useQuery({
    queryKey: ['loans'],
    queryFn: () => base44.entities.Loan.list('-created_date', 500),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 200),
  });

  const filtered = contracts.filter(c => {
    const q = search.toLowerCase();
    return !q || (c.client_name || '').toLowerCase().includes(q);
  });

  const fmt = (n) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n || 0);

  const buildContractHTML = (contract, loan, client, isImage = false) => {
    const scheduleRows = (loan.payment_schedule || []).map(s => `<tr><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:center;">${s.installment_number}</td><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:center;">${s.due_date}</td><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:right;">RD$ ${Number(s.amount).toFixed(2)}</td></tr>`).join('');
    return `<div style="font-family:Arial,sans-serif;${isImage ? 'width:650px;' : ''}padding:30px;background:white;color:#1a1a1a;font-size:13px;">
      <div style="display:flex;align-items:center;gap:16px;border-bottom:3px solid #d4a533;padding-bottom:16px;margin-bottom:20px;">
        <img src="${LOGO_URL}" style="width:70px;height:70px;object-fit:contain;"/>
        <div><div style="color:#d4a533;font-size:22px;font-weight:bold;">INVERSIONES CTEC</div><div style="color:#555;font-size:11px;">Servicios Financieros &middot; Rep&uacute;blica Dominicana</div></div>
        <div style="margin-left:auto;text-align:right;font-size:11px;color:#888;">Fecha: ${new Date().toLocaleDateString('es-DO')}</div>
      </div>
      <div style="text-align:center;font-size:16px;font-weight:bold;color:#333;background:#f9f5ec;padding:10px;border-radius:6px;margin-bottom:20px;border:1px solid #e8d89a;">&#128196; CONTRATO DE PR&Eacute;STAMO</div>
      <div style="margin-bottom:20px;"><div style="font-size:12px;font-weight:bold;color:#d4a533;text-transform:uppercase;border-bottom:1px solid #e8d89a;padding-bottom:4px;margin-bottom:10px;">Datos del Cliente</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div style="display:flex;justify-content:space-between;padding:6px 10px;background:#f9f9f9;border-radius:4px;"><span style="color:#666;">Nombre:</span><span style="font-weight:600;">${client?.first_name||''} ${client?.last_name||''}</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 10px;background:#f9f9f9;border-radius:4px;"><span style="color:#666;">C&eacute;dula:</span><span style="font-weight:600;">${client?.id_number||'&mdash;'}</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 10px;background:#f9f9f9;border-radius:4px;"><span style="color:#666;">Tel&eacute;fono:</span><span style="font-weight:600;">${client?.phone||'&mdash;'}</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 10px;background:#f9f9f9;border-radius:4px;"><span style="color:#666;">Direcci&oacute;n:</span><span style="font-weight:600;">${client?.address||'&mdash;'}</span></div>
        </div>
      </div>
      <div style="margin-bottom:20px;"><div style="font-size:12px;font-weight:bold;color:#d4a533;text-transform:uppercase;border-bottom:1px solid #e8d89a;padding-bottom:4px;margin-bottom:10px;">Condiciones del Pr&eacute;stamo</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div style="display:flex;justify-content:space-between;padding:6px 10px;background:#f9f9f9;border-radius:4px;"><span style="color:#666;">Monto:</span><span style="font-weight:600;">${fmt(loan.amount)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 10px;background:#f9f9f9;border-radius:4px;"><span style="color:#666;">Tasa:</span><span style="font-weight:600;">${loan.interest_rate}% ${TYPE_LABELS[loan.interest_type]||''}</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 10px;background:#f9f9f9;border-radius:4px;"><span style="color:#666;">Cuotas:</span><span style="font-weight:600;">${loan.num_installments}</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 10px;background:#f9f9f9;border-radius:4px;"><span style="color:#666;">Valor Cuota:</span><span style="font-weight:600;">${fmt(loan.installment_amount)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 10px;background:#f9f9f9;border-radius:4px;"><span style="color:#666;">Inicio:</span><span style="font-weight:600;">${loan.start_date}</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 10px;background:#f9f9f9;border-radius:4px;"><span style="color:#666;">Vencimiento:</span><span style="font-weight:600;">${loan.due_date||'&mdash;'}</span></div>
        </div>
      </div>
      <div style="background:linear-gradient(135deg,#fffbf0,#fff8e6);border:2px solid #d4a533;border-radius:8px;padding:16px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center;">
        <div><p style="color:#888;font-size:11px;">Capital</p><p style="font-size:17px;font-weight:bold;color:#3b82f6;">${fmt(loan.amount)}</p></div>
        <div><p style="color:#888;font-size:11px;">Inter&eacute;s Total</p><p style="font-size:17px;font-weight:bold;color:#d4a533;">${fmt(loan.total_interest)}</p></div>
        <div><p style="color:#888;font-size:11px;">TOTAL A PAGAR</p><p style="font-size:17px;font-weight:bold;color:#10b981;">${fmt(loan.total_to_pay)}</p></div>
      </div>
      <div style="margin-bottom:20px;"><div style="font-size:12px;font-weight:bold;color:#d4a533;text-transform:uppercase;border-bottom:1px solid #e8d89a;padding-bottom:4px;margin-bottom:10px;">Calendario de Pagos</div>
        <div style="display:flex;justify-content:space-between;padding:8px;background:#d4a533;color:white;font-weight:bold;font-size:12px;border-radius:4px 4px 0 0;"><span style="width:40px;text-align:center;">#</span><span style="flex:1;text-align:center;">Fecha de Vencimiento</span><span style="width:100px;text-align:right;">Monto</span></div>
        ${scheduleRows}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:30px;">
        <div style="text-align:center;border-top:1px solid #999;padding-top:6px;color:#555;font-size:11px;">Firma del Prestatario<br/>${client?.first_name||''} ${client?.last_name||''}</div>
        <div style="text-align:center;border-top:1px solid #999;padding-top:6px;color:#555;font-size:11px;">Firma Inversiones CTEC<br/>Autorizado</div>
      </div>
      <div style="text-align:center;margin-top:24px;padding-top:14px;border-top:2px solid #d4a533;color:#888;font-size:11px;"><strong>INVERSIONES CTEC</strong> &mdash; Tel: 809-462-2360</div>
    </div>`;
  };

  const reprintContract = (contract) => {
    const loan = loans.find(l => l.id === contract.loan_id);
    const client = clients.find(c => c.id === contract.client_id);
    if (!loan) return;
    const html = `<html><head><meta charset="UTF-8"></head><body>${buildContractHTML(contract, loan, client)}</body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  };

  const downloadContractPNG = async (contract) => {
    const loan = loans.find(l => l.id === contract.loan_id);
    const client = clients.find(c => c.id === contract.client_id);
    if (!loan) return;
    const { default: html2canvas } = await import('html2canvas');
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:700px;background:white;';
    container.innerHTML = buildContractHTML(contract, loan, client, true);
    document.body.appendChild(container);
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true });
    document.body.removeChild(container);
    const link = document.createElement('a');
    link.download = `contrato-${contract.client_name}-${contract.start_date || contract.printed_at || 'ctec'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Contratos</h1>
        <p className="text-sm text-gray-500 mt-1">{contracts.length} contratos guardados</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Buscar por cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-[#111827] border-[#1e293b] text-gray-200 placeholder:text-gray-600"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#d4a533]/30 border-t-[#d4a533] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-[#111827] rounded-xl border border-[#1e293b] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs border-b border-[#1e293b]">
                  <th className="text-left p-3 font-medium">Cliente</th>
                  <th className="text-right p-3 font-medium">Monto</th>
                  <th className="text-right p-3 font-medium">Total a Pagar</th>
                  <th className="text-center p-3 font-medium">Inicio</th>
                  <th className="text-center p-3 font-medium">Vencimiento</th>
                  <th className="text-center p-3 font-medium">Impreso el</th>
                  <th className="text-center p-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-[#1e293b]/50 hover:bg-white/[0.02]">
                    <td className="p-3 font-medium text-gray-200">{c.client_name}</td>
                    <td className="p-3 text-right text-gray-300">{fmt(c.loan_amount)}</td>
                    <td className="p-3 text-right text-[#d4a533]">{fmt(c.total_to_pay)}</td>
                    <td className="p-3 text-center text-gray-400">{c.start_date || '—'}</td>
                    <td className="p-3 text-center text-gray-400">{c.due_date || '—'}</td>
                    <td className="p-3 text-center text-gray-500 text-xs">{c.printed_at || c.created_date?.split('T')[0] || '—'}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/LoanDetail?id=${c.loan_id}`)}
                          className="flex items-center gap-1 text-xs text-[#d4a533] hover:underline"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver
                        </button>
                        <button
                          onClick={() => reprintContract(c)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
                        >
                          <Printer className="w-3.5 h-3.5" /> PDF
                        </button>
                        <button
                          onClick={() => downloadContractPNG(c)}
                          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                        >
                          <Download className="w-3.5 h-3.5" /> PNG
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-600">
                      {search ? 'No se encontraron contratos' : 'No hay contratos guardados. Se guardan automáticamente al imprimir desde un préstamo.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}