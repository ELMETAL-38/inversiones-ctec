import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, User, ChevronDown, ChevronUp, Printer, Download, Share2, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_69b62672be45da00af3df17b/0d96f8146_LogodeinversionesCTEC.png";
const TYPE_LABELS = { daily: 'Diario', weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };

const fmt = (n) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n || 0);
const today = new Date().toISOString().split('T')[0];

function calcMora(loan) {
  if (!loan.late_interest || loan.status === 'paid') return 0;
  const installmentMoras = (loan.payment_schedule || []).map((s, i) => {
    const dueDate = new Date(s.due_date);
    const todayD = new Date(today);
    const daysOverdue = Math.max(0, Math.floor((todayD - dueDate) / (1000 * 60 * 60 * 24)));
    const moraDays = Math.max(0, daysOverdue - (loan.grace_days || 0));
    return moraDays * (loan.late_interest / 100) * s.amount;
  });
  return installmentMoras.reduce((s, m) => s + m, 0);
}

function buildStatementHTML(client, loans) {
  const activeLoanData = loans.map(loan => {
    const mora = calcMora(loan);
    return { loan, mora };
  });

  const totalPrestado = loans.reduce((s, l) => s + (l.amount || 0), 0);
  const totalAPagar = loans.reduce((s, l) => s + (l.total_to_pay || 0), 0);
  const totalPagado = loans.reduce((s, l) => s + (l.total_paid || 0), 0);
  const totalSaldo = loans.reduce((s, l) => s + (l.remaining_balance || 0), 0);
  const totalMora = activeLoanData.reduce((s, { mora }) => s + mora, 0);
  const totalAdeudado = totalSaldo + totalMora;

  const loansRows = activeLoanData.map(({ loan, mora }, i) => `
    <div style="margin-bottom:14px;border:1px solid #e8d89a;border-radius:6px;overflow:hidden;">
      <div style="background:#d4a533;color:white;padding:7px 12px;font-size:12px;font-weight:bold;display:flex;justify-content:space-between;">
        <span>Préstamo #${i + 1} — ${TYPE_LABELS[loan.interest_type] || ''} ${loan.interest_rate}%</span>
        <span style="background:${loan.status==='paid'?'#10b981':mora>0?'#ef4444':'#3b82f6'};padding:2px 8px;border-radius:10px;font-size:11px;">
          ${loan.status === 'paid' ? 'PAGADO' : mora > 0 ? 'CON MORA' : 'ACTIVO'}
        </span>
      </div>
      <div style="padding:10px 12px;background:white;">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;margin-bottom:8px;">
          <div style="background:#eff6ff;border-radius:4px;padding:6px;">
            <div style="font-size:10px;color:#666;">Capital Prestado</div>
            <div style="font-size:14px;font-weight:bold;color:#3b82f6;">RD$ ${(loan.amount||0).toFixed(2)}</div>
          </div>
          <div style="background:#fefce8;border-radius:4px;padding:6px;">
            <div style="font-size:10px;color:#666;">Total a Pagar</div>
            <div style="font-size:14px;font-weight:bold;color:#d4a533;">RD$ ${(loan.total_to_pay||0).toFixed(2)}</div>
          </div>
          <div style="background:#f0fdf4;border-radius:4px;padding:6px;">
            <div style="font-size:10px;color:#666;">Total Pagado</div>
            <div style="font-size:14px;font-weight:bold;color:#10b981;">RD$ ${(loan.total_paid||0).toFixed(2)}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;">
          <div style="background:#fef9f0;border-radius:4px;padding:6px;">
            <div style="font-size:10px;color:#666;">Saldo Pendiente</div>
            <div style="font-size:14px;font-weight:bold;color:#f59e0b;">RD$ ${(loan.remaining_balance||0).toFixed(2)}</div>
          </div>
          <div style="background:${mora>0?'#fef2f2':'#f9f9f9'};border-radius:4px;padding:6px;">
            <div style="font-size:10px;color:#666;">Mora Acumulada</div>
            <div style="font-size:14px;font-weight:bold;color:${mora>0?'#ef4444':'#888'};">RD$ ${mora.toFixed(2)}</div>
          </div>
          <div style="background:#fffbf0;border-radius:4px;padding:6px;border:1px solid #d4a533;">
            <div style="font-size:10px;color:#666;font-weight:bold;">TOTAL ADEUDADO</div>
            <div style="font-size:14px;font-weight:bold;color:#b45309;">RD$ ${((loan.remaining_balance||0)+mora).toFixed(2)}</div>
          </div>
        </div>
        <div style="margin-top:6px;display:flex;gap:16px;font-size:11px;color:#888;">
          <span>Inicio: <b style="color:#333;">${loan.start_date||'—'}</b></span>
          <span>Vence: <b style="color:#333;">${loan.due_date||'—'}</b></span>
          <span>Cuotas: <b style="color:#333;">${loan.num_installments}</b></span>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <div style="font-family:Arial,sans-serif;width:680px;padding:30px;background:white;color:#1a1a1a;font-size:13px;">
      <div style="display:flex;align-items:center;gap:16px;border-bottom:3px solid #d4a533;padding-bottom:16px;margin-bottom:20px;">
        <img src="${LOGO_URL}" style="width:65px;height:65px;object-fit:contain;" />
        <div>
          <div style="color:#d4a533;font-size:20px;font-weight:bold;">INVERSIONES CTEC</div>
          <div style="color:#555;font-size:11px;">Servicios Financieros · República Dominicana</div>
        </div>
        <div style="margin-left:auto;text-align:right;font-size:11px;color:#888;">
          <div>Fecha: ${new Date().toLocaleDateString('es-DO')}</div>
          <div>Estado de Cuenta</div>
        </div>
      </div>

      <div style="text-align:center;font-size:15px;font-weight:bold;color:#333;background:#f9f5ec;padding:10px;border-radius:6px;margin-bottom:20px;border:1px solid #e8d89a;">
        📋 ESTADO DE CUENTA CONSOLIDADO
      </div>

      <div style="background:#f9f9f9;border:1px solid #e0e0e0;border-radius:6px;padding:14px;margin-bottom:20px;">
        <div style="font-size:12px;font-weight:bold;color:#d4a533;margin-bottom:8px;text-transform:uppercase;">Datos del Cliente</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;">
          <div><span style="color:#666;">Nombre:</span> <b>${client.first_name} ${client.last_name}</b></div>
          <div><span style="color:#666;">Cédula / ID:</span> <b>${client.id_number||'—'}</b></div>
          <div><span style="color:#666;">Teléfono:</span> <b>${client.phone||'—'}</b></div>
          <div><span style="color:#666;">Dirección:</span> <b>${client.address||'—'}</b></div>
        </div>
      </div>

      <div style="background:linear-gradient(135deg,#fffbf0,#fff8e6);border:2px solid #d4a533;border-radius:8px;padding:16px;margin-bottom:20px;">
        <div style="font-size:12px;font-weight:bold;color:#d4a533;margin-bottom:12px;text-transform:uppercase;text-align:center;">Resumen Total — ${loans.length} Préstamo(s)</div>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;text-align:center;">
          <div><div style="font-size:10px;color:#888;margin-bottom:4px;">Total Prestado</div><div style="font-size:15px;font-weight:bold;color:#3b82f6;">RD$ ${totalPrestado.toFixed(2)}</div></div>
          <div><div style="font-size:10px;color:#888;margin-bottom:4px;">Total a Pagar</div><div style="font-size:15px;font-weight:bold;color:#d4a533;">RD$ ${totalAPagar.toFixed(2)}</div></div>
          <div><div style="font-size:10px;color:#888;margin-bottom:4px;">Total Pagado</div><div style="font-size:15px;font-weight:bold;color:#10b981;">RD$ ${totalPagado.toFixed(2)}</div></div>
          <div><div style="font-size:10px;color:#888;margin-bottom:4px;">Mora Total</div><div style="font-size:15px;font-weight:bold;color:${totalMora>0?'#ef4444':'#888'};">RD$ ${totalMora.toFixed(2)}</div></div>
          <div style="background:#d4a533;border-radius:6px;padding:6px;"><div style="font-size:10px;color:rgba(255,255,255,0.8);margin-bottom:4px;">DEUDA TOTAL</div><div style="font-size:15px;font-weight:bold;color:white;">RD$ ${totalAdeudado.toFixed(2)}</div></div>
        </div>
      </div>

      <div style="font-size:12px;font-weight:bold;color:#d4a533;text-transform:uppercase;border-bottom:1px solid #e8d89a;padding-bottom:4px;margin-bottom:14px;">Detalle por Préstamo</div>
      ${loansRows}

      <div style="text-align:center;margin-top:20px;padding-top:14px;border-top:2px solid #d4a533;color:#888;font-size:11px;">
        <strong style="color:#d4a533;">INVERSIONES CTEC</strong> — Tel: 809-462-2360 · WhatsApp: 809-462-2260<br/>
        Documento generado el ${new Date().toLocaleDateString('es-DO')}
      </div>
    </div>
  `;
}

function ClientCard({ client, loans }) {
  const [expanded, setExpanded] = useState(false);

  const activeLoanData = loans.map(loan => ({ loan, mora: calcMora(loan) }));
  const totalPrestado = loans.reduce((s, l) => s + (l.amount || 0), 0);
  const totalPagado = loans.reduce((s, l) => s + (l.total_paid || 0), 0);
  const totalSaldo = loans.reduce((s, l) => s + (l.remaining_balance || 0), 0);
  const totalMora = activeLoanData.reduce((s, { mora }) => s + mora, 0);
  const totalAdeudado = totalSaldo + totalMora;

  const htmlContent = buildStatementHTML(client, loans);

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;}</style></head><body>${htmlContent}</body></html>`);
    win.document.close();
    win.onload = () => win.print();
  };

  const handleDownloadImage = async () => {
    const { default: html2canvas } = await import('html2canvas');
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:720px;background:white;';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true });
    document.body.removeChild(container);
    const link = document.createElement('a');
    link.download = `estado-cuenta-${client.first_name}-${client.last_name}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadPDF = () => {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><meta charset="UTF-8"><style>
      body{margin:0;padding:0;}
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>${htmlContent}<script>window.onload=()=>{window.print();}<\/script></body></html>`);
    win.document.close();
  };

  const handleShare = async () => {
    const { default: html2canvas } = await import('html2canvas');
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:720px;background:white;';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true });
    document.body.removeChild(container);
    canvas.toBlob(async (blob) => {
      const file = new File([blob], `estado-${client.first_name}-${client.last_name}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Estado de Cuenta — ${client.first_name} ${client.last_name}` });
      } else {
        const link = document.createElement('a');
        link.download = file.name;
        link.href = URL.createObjectURL(blob);
        link.click();
      }
    }, 'image/png');
  };

  return (
    <div className="bg-[#111827] rounded-xl border border-[#1e293b] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-5">
        {client.photo_url ? (
          <img src={client.photo_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-[#d4a533]/30 shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[#d4a533]/10 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-[#d4a533]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-100 text-base">{client.first_name} {client.last_name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Cédula: {client.id_number} · {loans.length} préstamo(s)</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Action buttons */}
          <button onClick={handlePrint} title="Imprimir PDF" className="p-2 rounded-lg bg-[#d4a533]/10 hover:bg-[#d4a533]/20 text-[#d4a533] transition-colors">
            <Printer className="w-4 h-4" />
          </button>
          <button onClick={handleDownloadImage} title="Descargar imagen" className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={handleShare} title="Compartir" className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={handleDownloadPDF} title="Guardar PDF" className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition-colors">
            <FileText className="w-4 h-4" />
          </button>
          <button onClick={() => setExpanded(e => !e)} className="p-2 rounded-lg hover:bg-white/5 text-gray-500 transition-colors ml-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-[#1e293b]">
        <div className="bg-[#0a0e17] p-3 text-center">
          <p className="text-[10px] text-gray-500 mb-1">Total Prestado</p>
          <p className="text-sm font-bold text-blue-400">{fmt(totalPrestado)}</p>
        </div>
        <div className="bg-[#0a0e17] p-3 text-center">
          <p className="text-[10px] text-gray-500 mb-1">Total Pagado</p>
          <p className="text-sm font-bold text-emerald-400">{fmt(totalPagado)}</p>
        </div>
        <div className="bg-[#0a0e17] p-3 text-center">
          <p className="text-[10px] text-gray-500 mb-1">Saldo Pendiente</p>
          <p className="text-sm font-bold text-yellow-400">{fmt(totalSaldo)}</p>
        </div>
        <div className="bg-[#0a0e17] p-3 text-center">
          <p className="text-[10px] text-gray-500 mb-1">Mora Total</p>
          <p className={`text-sm font-bold ${totalMora > 0 ? 'text-red-400' : 'text-gray-600'}`}>{fmt(totalMora)}</p>
        </div>
        <div className="bg-[#d4a533]/10 p-3 text-center border-l border-[#d4a533]/20">
          <p className="text-[10px] text-[#d4a533] mb-1 font-semibold">DEUDA TOTAL</p>
          <p className="text-sm font-bold text-white">{fmt(totalAdeudado)}</p>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="p-5 space-y-3 border-t border-[#1e293b]">
          {activeLoanData.map(({ loan, mora }, i) => (
            <div key={loan.id} className="bg-[#0a0e17] rounded-lg border border-[#1e293b] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-400">Préstamo #{i + 1} — {TYPE_LABELS[loan.interest_type]} {loan.interest_rate}%</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  loan.status === 'paid' ? 'bg-blue-500/10 text-blue-400' :
                  mora > 0 ? 'bg-red-500/10 text-red-400' :
                  'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {loan.status === 'paid' ? 'Pagado' : mora > 0 ? 'Con mora' : 'Activo'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-[#111827] rounded p-2">
                  <p className="text-gray-500 mb-0.5">Capital</p>
                  <p className="font-bold text-blue-400">{fmt(loan.amount)}</p>
                </div>
                <div className="bg-[#111827] rounded p-2">
                  <p className="text-gray-500 mb-0.5">Pagado</p>
                  <p className="font-bold text-emerald-400">{fmt(loan.total_paid)}</p>
                </div>
                <div className="bg-[#111827] rounded p-2">
                  <p className="text-gray-500 mb-0.5">Saldo</p>
                  <p className="font-bold text-yellow-400">{fmt(loan.remaining_balance)}</p>
                </div>
                <div className={`rounded p-2 ${mora > 0 ? 'bg-red-500/10' : 'bg-[#111827]'}`}>
                  <p className="text-gray-500 mb-0.5">Mora</p>
                  <p className={`font-bold ${mora > 0 ? 'text-red-400' : 'text-gray-600'}`}>{fmt(mora)}</p>
                </div>
              </div>
              <div className="mt-2 flex gap-3 text-xs text-gray-600">
                <span>Inicio: <span className="text-gray-400">{loan.start_date || '—'}</span></span>
                <span>Vence: <span className="text-gray-400">{loan.due_date || '—'}</span></span>
                <span>Cuotas: <span className="text-gray-400">{loan.num_installments}</span></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClientStatement() {
  const [search, setSearch] = useState('');

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 200),
  });

  const { data: loans = [], isLoading: loadingLoans } = useQuery({
    queryKey: ['loans'],
    queryFn: () => base44.entities.Loan.list('-created_date', 500),
  });

  const isLoading = loadingClients || loadingLoans;

  // Group loans by client_id
  const loansByClient = loans.reduce((acc, loan) => {
    if (!acc[loan.client_id]) acc[loan.client_id] = [];
    acc[loan.client_id].push(loan);
    return acc;
  }, {});

  // Only show clients that have loans
  const clientsWithLoans = clients.filter(c => loansByClient[c.id]?.length > 0);

  const filtered = clientsWithLoans.filter(c => {
    const q = search.toLowerCase();
    return !q || `${c.first_name} ${c.last_name} ${c.id_number}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Estado de Cuenta por Cliente</h1>
        <p className="text-sm text-gray-500 mt-1">{clientsWithLoans.length} cliente(s) con préstamos</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-[#111827] border-[#1e293b] text-gray-200 placeholder:text-gray-600"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#d4a533]/30 border-t-[#d4a533] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          {search ? 'No se encontraron clientes' : 'No hay clientes con préstamos registrados'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              loans={loansByClient[client.id] || []}
            />
          ))}
        </div>
      )}
    </div>
  );
}