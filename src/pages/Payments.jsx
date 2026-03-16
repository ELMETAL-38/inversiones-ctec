import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, FileText, Image } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import html2canvas from 'html2canvas';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_69b62672be45da00af3df17b/0d96f8146_LogodeinversionesCTEC.png";

export default function Payments() {
  const [search, setSearch] = useState('');

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list('-created_date', 500),
  });

  const filtered = payments.filter(p => {
    const q = search.toLowerCase();
    return !q || (p.client_name || '').toLowerCase().includes(q);
  });

  const fmt = (n) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n || 0);

  const generateReceipt = (p) => {
    const receiptHtml = `
      <html><head><style>
        body { font-family: Arial; max-width: 400px; margin: auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #d4a533; padding-bottom: 15px; }
        .logo { width: 80px; height: 80px; }
        h1 { color: #d4a533; margin: 5px 0; font-size: 18px; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .total { font-size: 20px; font-weight: bold; color: #10b981; text-align: center; margin-top: 15px; }
        .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #999; }
      </style></head><body>
        <div class="header">
          <img src="${LOGO_URL}" class="logo" />
          <h1>INVERSIONES CTEC</h1>
          <p style="font-size:12px;color:#666;">Recibo de Pago</p>
        </div>
        <div class="row"><span>Cliente:</span><strong>${p.client_name || ''}</strong></div>
        <div class="row"><span>Fecha:</span><strong>${p.payment_date}</strong></div>
        <div class="row"><span>Monto Pagado:</span><strong>RD$ ${p.amount?.toFixed(2)}</strong></div>
        <div class="row"><span>Saldo Pendiente:</span><strong>RD$ ${(p.remaining_balance || 0).toFixed(2)}</strong></div>
        ${p.notes ? `<div class="row"><span>Notas:</span><span>${p.notes}</span></div>` : ''}
        <div class="total">✓ Pago Recibido: RD$ ${p.amount?.toFixed(2)}</div>
        <div class="footer">
          Inversiones CTEC — Gracias por su pago<br/>
          Contacto WhatsApp: 809-462-2260
        </div>
      </body></html>
    `;
    const win = window.open('', '_blank');
    win.document.write(receiptHtml);
    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Pagos</h1>
        <p className="text-sm text-gray-500 mt-1">{payments.length} pagos registrados</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input placeholder="Buscar por cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-[#111827] border-[#1e293b] text-gray-200 placeholder:text-gray-600" />
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
                  <th className="text-left p-3 font-medium">Fecha</th>
                  <th className="text-right p-3 font-medium">Monto</th>
                  <th className="text-center p-3 font-medium">Tipo</th>
                  <th className="text-right p-3 font-medium">Saldo Rest.</th>
                  <th className="text-center p-3 font-medium">Recibo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-[#1e293b]/50 hover:bg-white/[0.02]">
                    <td className="p-3 font-medium text-gray-200">
                      <Link to={`/LoanDetail?id=${p.loan_id}`} className="hover:text-[#d4a533]">{p.client_name || '—'}</Link>
                    </td>
                    <td className="p-3 text-gray-400">{p.payment_date}</td>
                    <td className="p-3 text-right text-emerald-400 font-medium">{fmt(p.amount)}</td>
                    <td className="p-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.payment_type === 'full' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                        {p.payment_type === 'full' ? 'Completo' : 'Parcial'}
                      </span>
                    </td>
                    <td className="p-3 text-right text-gray-400">{fmt(p.remaining_balance)}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => generateReceipt(p)} className="text-[#d4a533] hover:text-[#b8922d] p-1">
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-600">No hay pagos registrados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}