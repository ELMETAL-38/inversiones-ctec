import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, FileText, Printer, Eye, Trash2, Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

const TYPE_LABELS = { daily: 'Diario', weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };
const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_69b62672be45da00af3df17b/0d96f8146_LogodeinversionesCTEC.png";

export default function Contracts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingContract, setDeletingContract] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadPasswordOpen, setDownloadPasswordOpen] = useState(false);
  const [downloadPassword, setDownloadPassword] = useState('');
  const [downloadPasswordError, setDownloadPasswordError] = useState(false);
  const [shareOpen, setShareOpen] = useState(null);

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

  const deleteMutation = useMutation({
    mutationFn: (contractId) => base44.entities.Contract.delete(contractId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setDeleteOpen(false);
      setDeletePassword('');
      setDeleteError(false);
      setDeletingContract(null);
    }
  });

  const filtered = contracts.filter(c => {
    const q = search.toLowerCase();
    return !q || (c.client_name || '').toLowerCase().includes(q);
  });

  const fmt = (n) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n || 0);

  const performDownload = async () => {
    setDownloading(true);
    try {
      const response = await base44.functions.invoke('downloadContracts', {});
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contratos-${new Date().getTime()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Contratos descargados');
    } catch (err) {
      toast.error('Error descargando contratos: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPassword = (e) => {
    e.preventDefault();
    if (downloadPassword !== '3030') { setDownloadPasswordError(true); return; }
    setDownloadPasswordOpen(false);
    setDownloadPassword('');
    setDownloadPasswordError(false);
    performDownload();
  };

  const handleShare = (contract, platform) => {
    const client = clients.find(c => c.id === contract.client_id);
    const text = `Contrato de Préstamo - ${client?.first_name} ${client?.last_name} - Monto: ${fmt(contract.loan_amount)}`;
    
    if (platform === 'whatsapp') {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' - ' + window.location.origin)}`;
      window.open(whatsappUrl, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(text);
      toast.success('Copiado al portapapeles');
    }
    setShareOpen(null);
  };

  const reprintContract = (contract) => {
    const loan = loans.find(l => l.id === contract.loan_id);
    const client = clients.find(c => c.id === contract.client_id);
    if (!loan) return;

    const scheduleRows = (loan.payment_schedule || []).map(s => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:center;">${s.installment_number}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:center;">${s.due_date}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:right;">RD$ ${Number(s.amount).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `<html><head><meta charset="UTF-8"><style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 30px; font-size: 13px; }
      .header { display:flex; align-items:center; gap:16px; border-bottom: 3px solid #d4a533; padding-bottom: 16px; margin-bottom: 20px; }
      .logo { width:70px; height:70px; object-fit:contain; }
      .company h1 { color:#d4a533; font-size:22px; font-weight:bold; letter-spacing:1px; }
      .doc-title { text-align:center; font-size:16px; font-weight:bold; color:#333; background:#f9f5ec; padding:10px; border-radius:6px; margin-bottom:20px; border:1px solid #e8d89a; }
      .section { margin-bottom:20px; }
      .section-title { font-size:12px; font-weight:bold; color:#d4a533; text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid #e8d89a; padding-bottom:4px; margin-bottom:10px; }
      .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
      .info-item { display:flex; justify-content:space-between; padding:6px 10px; background:#f9f9f9; border-radius:4px; }
      .info-item span:first-child { color:#666; }
      .info-item span:last-child { font-weight:600; color:#1a1a1a; }
      .totals-box { background:linear-gradient(135deg, #fffbf0, #fff8e6); border:2px solid #d4a533; border-radius:8px; padding:16px; margin-bottom:20px; }
      .totals-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; text-align:center; }
      .total-item p:first-child { color:#888; font-size:11px; }
      .total-item p:last-child { font-size:17px; font-weight:bold; margin-top:3px; }
      table { width:100%; border-collapse:collapse; font-size:12px; }
      thead tr { background:#d4a533; color:#fff; }
      thead th { padding:8px; text-align:center; }
      tbody tr:nth-child(even) { background:#fafafa; }
      .signature-area { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:30px; }
      .sig-box { text-align:center; border-top:1px solid #999; padding-top:6px; color:#555; font-size:11px; }
      .footer { text-align:center; margin-top:24px; padding-top:14px; border-top:2px solid #d4a533; color:#888; font-size:11px; }
    </style></head><body>
      <div class="header">
        <img src="${LOGO_URL}" class="logo" />
        <div class="company"><h1>INVERSIONES CTEC</h1><p>Servicios Financieros · República Dominicana</p></div>
        <div style="margin-left:auto;text-align:right;font-size:11px;color:#888;"><p>Fecha: ${new Date().toLocaleDateString('es-DO')}</p><p>Contrato de Préstamo</p></div>
      </div>
      <div class="doc-title">📄 CONTRATO DE PRÉSTAMO</div>
      <div class="section">
        <div class="section-title">Datos del Cliente</div>
        <div class="info-grid">
          <div class="info-item"><span>Nombre:</span><span>${client?.first_name || ''} ${client?.last_name || ''}</span></div>
          <div class="info-item"><span>Cédula / ID:</span><span>${client?.id_number || '—'}</span></div>
          <div class="info-item"><span>Teléfono:</span><span>${client?.phone || '—'}</span></div>
          <div class="info-item"><span>Dirección:</span><span>${client?.address || '—'}</span></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Condiciones del Préstamo</div>
        <div class="info-grid">
          <div class="info-item"><span>Monto Prestado:</span><span>${fmt(loan.amount)}</span></div>
          <div class="info-item"><span>Tasa de Interés:</span><span>${loan.interest_rate}% ${TYPE_LABELS[loan.interest_type] || ''}</span></div>
          <div class="info-item"><span>Número de Cuotas:</span><span>${loan.num_installments}</span></div>
          <div class="info-item"><span>Valor por Cuota:</span><span>${fmt(loan.installment_amount)}</span></div>
          <div class="info-item"><span>Fecha de Inicio:</span><span>${loan.start_date}</span></div>
          <div class="info-item"><span>Fecha de Vencimiento:</span><span>${loan.due_date || '—'}</span></div>
          <div class="info-item"><span>Interés por Mora:</span><span>${loan.late_interest}%</span></div>
          <div class="info-item"><span>Días de Gracia:</span><span>${loan.grace_days} días</span></div>
        </div>
      </div>
      <div class="totals-box">
        <div class="totals-grid">
          <div class="total-item"><p>Capital</p><p style="color:#3b82f6;">${fmt(loan.amount)}</p></div>
          <div class="total-item"><p>Interés Total</p><p style="color:#d4a533;">${fmt(loan.total_interest)}</p></div>
          <div class="total-item"><p>TOTAL A PAGAR</p><p style="color:#10b981;">${fmt(loan.total_to_pay)}</p></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Calendario de Pagos</div>
        <table><thead><tr><th>#</th><th>Fecha de Vencimiento</th><th>Monto</th></tr></thead><tbody>${scheduleRows}</tbody></table>
      </div>
      <div class="signature-area">
        <div class="sig-box">Firma del Prestatario<br/>${client?.first_name || ''} ${client?.last_name || ''}</div>
        <div class="sig-box">Firma Inversiones CTEC<br/>Autorizado</div>
      </div>
      <div class="footer">
        <strong>INVERSIONES CTEC</strong> — Tel: 809-462-2360<br/>
        Este documento constituye un contrato de préstamo legalmente vinculante.
      </div>
    </body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Contratos</h1>
          <p className="text-sm text-gray-500 mt-1">{contracts.length} contratos guardados</p>
        </div>
        <button
          onClick={() => { setDownloadPassword(''); setDownloadPasswordError(false); setDownloadPasswordOpen(true); }}
          disabled={downloading || contracts.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Descargando...' : 'Descargar Todo'}
        </button>
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
                          <Printer className="w-3.5 h-3.5" /> Reimprimir
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setShareOpen(shareOpen === c.id ? null : c.id)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400"
                          >
                            <Share2 className="w-3.5 h-3.5" /> Compartir
                          </button>
                          {shareOpen === c.id && (
                            <div className="absolute right-0 mt-1 bg-[#0a0e17] border border-[#1e293b] rounded-lg shadow-lg z-50">
                              <button
                                onClick={() => handleShare(c, 'whatsapp')}
                                className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 whitespace-nowrap"
                              >
                                WhatsApp
                              </button>
                              <button
                                onClick={() => handleShare(c, 'copy')}
                                className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 whitespace-nowrap border-t border-[#1e293b]"
                              >
                                Copiar
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => { setDeletingContract(c); setDeletePassword(''); setDeleteError(false); setDeleteOpen(true); }}
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
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

      {/* Download Password Dialog */}
      <AlertDialog open={downloadPasswordOpen} onOpenChange={(open) => { setDownloadPasswordOpen(open); if (!open) { setDownloadPassword(''); setDownloadPasswordError(false); } }}>
        <AlertDialogContent className="bg-[#111827] border-[#1e293b] text-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Verificar acceso</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Ingrese la contraseña para descargar los contratos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={handleDownloadPassword}>
            <div className="py-2">
              <input
                type="password"
                value={downloadPassword}
                onChange={e => { setDownloadPassword(e.target.value); setDownloadPasswordError(false); }}
                placeholder="Contraseña"
                autoFocus
                className={`w-full px-3 py-2 rounded-lg bg-[#0a0e17] border text-gray-200 text-sm outline-none focus:ring-2 transition-all ${
                  downloadPasswordError ? 'border-red-500 focus:ring-red-500/30' : 'border-[#1e293b] focus:ring-[#d4a533]/30'
                }`}
              />
              {downloadPasswordError && <p className="text-red-400 text-xs mt-1">Contraseña incorrecta</p>}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-[#1e293b] text-gray-400 hover:bg-white/5">Cancelar</AlertDialogCancel>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm"
              >Descargar</button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) { setDeletePassword(''); setDeleteError(false); } }}>
        <AlertDialogContent className="bg-[#111827] border-[#1e293b] text-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contrato?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Se eliminará permanentemente el contrato de {deletingContract?.client_name}. Ingrese la contraseña para confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <input
              type="password"
              value={deletePassword}
              onChange={e => { setDeletePassword(e.target.value); setDeleteError(false); }}
              placeholder="Contraseña"
              className={`w-full px-3 py-2 rounded-lg bg-[#0a0e17] border text-gray-200 text-sm outline-none focus:ring-2 transition-all ${
                deleteError ? 'border-red-500 focus:ring-red-500/30' : 'border-[#1e293b] focus:ring-[#d4a533]/30'
              }`}
            />
            {deleteError && <p className="text-red-400 text-xs mt-1">Contraseña incorrecta</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1e293b] text-gray-400 hover:bg-white/5">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deletePassword !== '3030') { setDeleteError(true); return; }
                deleteMutation.mutate(deletingContract?.id);
              }}
              className="bg-red-600 hover:bg-red-700"
            >Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}