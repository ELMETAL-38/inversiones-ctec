import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Trash2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const STATUS_LABELS = { all: 'Todos', active: 'Activos', paid: 'Pagados', overdue: 'Vencidos' };
const STATUS_COLORS = {
  active: 'bg-emerald-500/10 text-emerald-400',
  paid: 'bg-blue-500/10 text-blue-400',
  overdue: 'bg-red-500/10 text-red-400',
  defaulted: 'bg-orange-500/10 text-orange-400',
};
const STATUS_TEXT = { active: 'Activo', paid: 'Pagado', overdue: 'Vencido', defaulted: 'Moroso' };

export default function Loans() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingLoan, setDeletingLoan] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState(false);

  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 200),
  });

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['loans'],
    queryFn: () => base44.entities.Loan.list('-created_date', 200),
  });

  const deleteMutation = useMutation({
    mutationFn: async (loan) => {
      await base44.entities.Loan.delete(loan.id);
      // Also delete related payments
      const payments = await base44.entities.Payment.filter({ loan_id: loan.id });
      await Promise.all(payments.map(p => base44.entities.Payment.delete(p.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setDeleteOpen(false);
      toast.success('Préstamo eliminado');
    },
  });

  const printContract = async (loan) => {
    const client = clients.find(c => c.id === loan.client_id);
    const clientFirstName = client?.first_name || loan.client_name?.split(' ')[0] || '';
    const clientLastName = client?.last_name || loan.client_name?.split(' ').slice(1).join(' ') || '';
    try {
      await base44.entities.Contract.create({
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
    } catch (_) {}
    const fmtL = (n) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n || 0);
    const TL = { daily: 'Diario', weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };
    const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_69b62672be45da00af3df17b/0d96f8146_LogodeinversionesCTEC.png';
    const rows = (loan.payment_schedule || []).map(s => `<tr><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:center;">${s.installment_number}</td><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:center;">${s.due_date}</td><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:right;">RD$ ${Number(s.amount).toFixed(2)}</td></tr>`).join('');
    const html = `<html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#1a1a1a;padding:30px;font-size:13px}.hdr{display:flex;align-items:center;gap:16px;border-bottom:3px solid #d4a533;padding-bottom:16px;margin-bottom:20px}.logo{width:70px;height:70px;object-fit:contain}.ttl{text-align:center;font-size:16px;font-weight:bold;color:#333;background:#f9f5ec;padding:10px;border-radius:6px;margin-bottom:20px;border:1px solid #e8d89a}.sec{margin-bottom:20px}.sec-t{font-size:12px;font-weight:bold;color:#d4a533;text-transform:uppercase;border-bottom:1px solid #e8d89a;padding-bottom:4px;margin-bottom:10px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.item{display:flex;justify-content:space-between;padding:6px 10px;background:#f9f9f9;border-radius:4px}.item span:first-child{color:#666}.item span:last-child{font-weight:600}.box{background:linear-gradient(135deg,#fffbf0,#fff8e6);border:2px solid #d4a533;border-radius:8px;padding:16px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center}table{width:100%;border-collapse:collapse;font-size:12px}thead tr{background:#d4a533;color:#fff}thead th{padding:8px;text-align:center}tbody tr:nth-child(even){background:#fafafa}.sigs{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:30px}.sig{text-align:center;border-top:1px solid #999;padding-top:6px;color:#555;font-size:11px}.ftr{text-align:center;margin-top:24px;padding-top:14px;border-top:2px solid #d4a533;color:#888;font-size:11px}</style></head><body><div class="hdr"><img src="${LOGO_URL}" class="logo"/><div><div style="color:#d4a533;font-size:22px;font-weight:bold;">INVERSIONES CTEC</div><div style="color:#555;font-size:11px;">Servicios Financieros &middot; Rep&uacute;blica Dominicana</div></div><div style="margin-left:auto;text-align:right;font-size:11px;color:#888;">Fecha: ${new Date().toLocaleDateString('es-DO')}</div></div><div class="ttl">&#128196; CONTRATO DE PR&Eacute;STAMO</div><div class="sec"><div class="sec-t">Datos del Cliente</div><div class="grid"><div class="item"><span>Nombre:</span><span>${clientFirstName} ${clientLastName}</span></div><div class="item"><span>C&eacute;dula / ID:</span><span>${client?.id_number||'&mdash;'}</span></div><div class="item"><span>Tel&eacute;fono:</span><span>${client?.phone||'&mdash;'}</span></div><div class="item"><span>Direcci&oacute;n:</span><span>${client?.address||'&mdash;'}</span></div></div></div><div class="sec"><div class="sec-t">Condiciones del Pr&eacute;stamo</div><div class="grid"><div class="item"><span>Monto Prestado:</span><span>${fmtL(loan.amount)}</span></div><div class="item"><span>Tasa de Inter&eacute;s:</span><span>${loan.interest_rate}% ${TL[loan.interest_type]||''}</span></div><div class="item"><span>N&uacute;mero de Cuotas:</span><span>${loan.num_installments}</span></div><div class="item"><span>Valor por Cuota:</span><span>${fmtL(loan.installment_amount)}</span></div><div class="item"><span>Fecha de Inicio:</span><span>${loan.start_date}</span></div><div class="item"><span>Fecha de Vencimiento:</span><span>${loan.due_date||'&mdash;'}</span></div><div class="item"><span>Inter&eacute;s por Mora:</span><span>${loan.late_interest}%</span></div><div class="item"><span>D&iacute;as de Gracia:</span><span>${loan.grace_days} d&iacute;as</span></div></div></div><div class="box"><div><p style="color:#888;font-size:11px;">Capital</p><p style="font-size:17px;font-weight:bold;color:#3b82f6;">${fmtL(loan.amount)}</p></div><div><p style="color:#888;font-size:11px;">Inter&eacute;s Total</p><p style="font-size:17px;font-weight:bold;color:#d4a533;">${fmtL(loan.total_interest)}</p></div><div><p style="color:#888;font-size:11px;">TOTAL A PAGAR</p><p style="font-size:17px;font-weight:bold;color:#10b981;">${fmtL(loan.total_to_pay)}</p></div></div><div class="sec"><div class="sec-t">Calendario de Pagos</div><table><thead><tr><th>#</th><th>Fecha de Vencimiento</th><th>Monto</th></tr></thead><tbody>${rows}</tbody></table></div><div class="sigs"><div class="sig">Firma del Prestatario<br/>${clientFirstName} ${clientLastName}</div><div class="sig">Firma Inversiones CTEC<br/>Autorizado</div></div><div class="ftr"><strong>INVERSIONES CTEC</strong> &mdash; Tel: 809-462-2360</div></body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  };

  const today = new Date().toISOString().split('T')[0];
  const filtered = loans.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || (l.client_name || '').toLowerCase().includes(q);
    let effectiveStatus = l.status;
    if (effectiveStatus === 'active' && l.due_date && l.due_date < today) effectiveStatus = 'overdue';
    const matchTab = tab === 'all' || effectiveStatus === tab;
    return matchSearch && matchTab;
  });

  const fmt = (n) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Préstamos</h1>
          <p className="text-sm text-gray-500 mt-1">{loans.length} préstamos totales</p>
        </div>
        <Link to="/NewLoan">
          <Button className="bg-[#d4a533] hover:bg-[#b8922d] text-black font-semibold">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Préstamo
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input placeholder="Buscar por cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-[#111827] border-[#1e293b] text-gray-200 placeholder:text-gray-600" />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-[#111827] border border-[#1e293b]">
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <TabsTrigger key={k} value={k} className="text-xs data-[state=active]:bg-[#d4a533]/15 data-[state=active]:text-[#d4a533]">{v}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
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
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-right p-3 font-medium">Pagado</th>
                  <th className="text-right p-3 font-medium">Saldo</th>
                  <th className="text-right p-3 font-medium text-red-400">Mora</th>
                  <th className="text-right p-3 font-medium text-yellow-400">Total Adeudado</th>
                  <th className="text-center p-3 font-medium">Estado</th>
                  <th className="text-center p-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => {
                  let status = l.status;
                  if (status === 'active' && l.due_date && l.due_date < today) status = 'overdue';
                  const mora = (() => {
                    if (!l.due_date || !l.late_interest || !l.remaining_balance || l.status === 'paid') return 0;
                    const dueDate = new Date(l.due_date);
                    const todayDate = new Date(today);
                    const daysOverdue = Math.max(0, Math.floor((todayDate - dueDate) / (1000 * 60 * 60 * 24)));
                    const graceUsed = Math.max(0, daysOverdue - (l.grace_days || 0));
                    return graceUsed * (l.late_interest / 100) * l.remaining_balance;
                  })();
                  return (
                    <tr key={l.id} className="border-b border-[#1e293b]/50 hover:bg-white/[0.02]">
                      <td className="p-3 font-medium text-gray-200">{l.client_name || '—'}</td>
                      <td className="p-3 text-right text-gray-300">{fmt(l.amount)}</td>
                      <td className="p-3 text-right text-gray-300">{fmt(l.total_to_pay)}</td>
                      <td className="p-3 text-right text-emerald-400">{fmt(l.total_paid)}</td>
                      <td className="p-3 text-right text-[#d4a533]">{fmt(l.remaining_balance)}</td>
                      <td className={`p-3 text-right font-medium ${mora > 0 ? 'text-red-400' : 'text-gray-600'}`}>{mora > 0 ? fmt(mora) : '—'}</td>
                      <td className="p-3 text-right font-bold text-yellow-400">{fmt((l.remaining_balance || 0) + mora)}</td>
                      <td className="p-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status]}`}>
                          {STATUS_TEXT[status]}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => navigate(`/LoanDetail?id=${l.id}`)} className="inline-flex items-center gap-1 text-xs text-[#d4a533] hover:underline cursor-pointer">
                            <Eye className="w-3.5 h-3.5" /> Ver
                          </button>
                          <button onClick={() => printContract(l)} title="Imprimir contrato" className="text-gray-500 hover:text-[#d4a533] transition-colors p-1">
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { setDeletingLoan(l); setDeletePassword(''); setDeleteError(false); setDeleteOpen(true); }} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-12 text-gray-600">No hay préstamos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <AlertDialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) { setDeletePassword(''); setDeleteError(false); } }}>
        <AlertDialogContent className="bg-[#111827] border-[#1e293b] text-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar préstamo?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Se eliminará el préstamo de <strong className="text-gray-300">{deletingLoan?.client_name}</strong> junto con todo su historial de pagos. Ingrese la contraseña para confirmar.
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
                deleteMutation.mutate(deletingLoan);
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}