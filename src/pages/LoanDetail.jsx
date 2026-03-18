import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, DollarSign, Calendar, User, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_69b62672be45da00af3df17b/0d96f8146_LogodeinversionesCTEC.png";
const STATUS_TEXT = { active: 'Activo', paid: 'Pagado', overdue: 'Vencido', defaulted: 'Moroso', pending: 'Pendiente' };
const TYPE_LABELS = { daily: 'Diario', weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };

export default function LoanDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const loanId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const { data: loan, isLoading } = useQuery({
    queryKey: ['loan', loanId],
    queryFn: () => base44.entities.Loan.list().then(list => list.find(l => l.id === loanId)),
    enabled: !!loanId,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['loan-payments', loanId],
    queryFn: () => base44.entities.Payment.filter({ loan_id: loanId }, '-created_date', 100),
    enabled: !!loanId,
  });

  const payMutation = useMutation({
    mutationFn: async (payData) => {
      await base44.entities.Payment.create(payData);
      const newTotalPaid = (loan.total_paid || 0) + payData.amount;
      const newBalance = (loan.total_to_pay || 0) - newTotalPaid;
      const updateData = { total_paid: newTotalPaid, remaining_balance: newBalance };
      if (newBalance <= 0) updateData.status = 'paid';
      await base44.entities.Loan.update(loanId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan', loanId] });
      queryClient.invalidateQueries({ queryKey: ['loan-payments', loanId] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setPayDialogOpen(false);
      setPayAmount('');
      setPayNotes('');
      toast.success('Pago registrado');
    }
  });

  const handlePay = (e) => {
    e.preventDefault();
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return;
    payMutation.mutate({
      loan_id: loanId,
      client_id: loan.client_id,
      client_name: loan.client_name,
      amount,
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      payment_type: amount >= (loan.remaining_balance || 0) ? 'full' : 'partial',
      remaining_balance: Math.max(0, (loan.remaining_balance || 0) - amount),
      notes: payNotes,
    });
  };

  const generateReceipt = (payment) => {
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
        <div class="row"><span>Cliente:</span><strong>${loan?.client_name || ''}</strong></div>
        <div class="row"><span>Fecha:</span><strong>${payment.payment_date}</strong></div>
        <div class="row"><span>Monto Pagado:</span><strong>RD$ ${payment.amount?.toFixed(2)}</strong></div>
        <div class="row"><span>Saldo Pendiente:</span><strong>RD$ ${payment.remaining_balance?.toFixed(2)}</strong></div>
        ${payment.notes ? `<div class="row"><span>Notas:</span><span>${payment.notes}</span></div>` : ''}
        <div class="total">✓ Pago Recibido: RD$ ${payment.amount?.toFixed(2)}</div>
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

  const downloadReceiptAsImage = async (payment) => {
    const { default: html2canvas } = await import('html2canvas');
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:440px;background:white;padding:0;';
    container.innerHTML = `
      <div style="font-family:Arial,sans-serif;width:400px;margin:0 auto;padding:20px;background:white;">
        <div style="text-align:center;border-bottom:2px solid #d4a533;padding-bottom:15px;margin-bottom:10px;">
          <img src="${LOGO_URL}" style="width:70px;height:70px;object-fit:contain;" />
          <div style="color:#d4a533;font-size:18px;font-weight:bold;margin:5px 0;">INVERSIONES CTEC</div>
          <div style="font-size:12px;color:#666;">Recibo de Pago</div>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;"><span>Cliente:</span><strong>${loan?.client_name || ''}</strong></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;"><span>Fecha:</span><strong>${payment.payment_date}</strong></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;"><span>Monto Pagado:</span><strong>RD$ ${payment.amount?.toFixed(2)}</strong></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;"><span>Saldo Pendiente:</span><strong>RD$ ${(payment.remaining_balance || 0).toFixed(2)}</strong></div>
        ${payment.notes ? `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;"><span>Notas:</span><span>${payment.notes}</span></div>` : ''}
        <div style="font-size:18px;font-weight:bold;color:#10b981;text-align:center;margin-top:15px;">✓ Pago Recibido: RD$ ${payment.amount?.toFixed(2)}</div>
        <div style="text-align:center;margin-top:20px;font-size:11px;color:#999;">📱 WhatsApp Gestor: 809-462-2260<br/>Inversiones CTEC — Gracias por su pago</div>
      </div>
    `;
    document.body.appendChild(container);
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true });
    document.body.removeChild(container);
    const link = document.createElement('a');
    link.download = `recibo-${payment.payment_date}-${loan?.client_name || ''}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (isLoading || !loan) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#d4a533]/30 border-t-[#d4a533] rounded-full animate-spin" />
      </div>
    );
  }

  const fmt = (n) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n || 0);
  const progress = loan.total_to_pay ? ((loan.total_paid || 0) / loan.total_to_pay) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/Loans" className="p-2 rounded-lg hover:bg-white/5 text-gray-500"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-100">{loan.client_name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Préstamo — {TYPE_LABELS[loan.interest_type]}</p>
        </div>
        <Button onClick={() => { setPayAmount(String(loan.installment_amount || '')); setPayDialogOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" disabled={loan.status === 'paid'}>
          <DollarSign className="w-4 h-4 mr-1" /> Registrar Pago
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#111827] rounded-xl border border-[#1e293b] p-4 text-center">
          <p className="text-xs text-gray-500">Monto</p>
          <p className="text-lg font-bold text-gray-200 mt-1">{fmt(loan.amount)}</p>
        </div>
        <div className="bg-[#111827] rounded-xl border border-[#1e293b] p-4 text-center">
          <p className="text-xs text-gray-500">Total a Pagar</p>
          <p className="text-lg font-bold text-[#d4a533] mt-1">{fmt(loan.total_to_pay)}</p>
        </div>
        <div className="bg-[#111827] rounded-xl border border-[#1e293b] p-4 text-center">
          <p className="text-xs text-gray-500">Pagado</p>
          <p className="text-lg font-bold text-emerald-400 mt-1">{fmt(loan.total_paid)}</p>
        </div>
        <div className="bg-[#111827] rounded-xl border border-[#1e293b] p-4 text-center">
          <p className="text-xs text-gray-500">Saldo</p>
          <p className="text-lg font-bold text-red-400 mt-1">{fmt(loan.remaining_balance)}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-[#111827] rounded-xl border border-[#1e293b] p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Progreso de pago</span>
          <span className="text-xs text-[#d4a533] font-semibold">{progress.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-[#1e293b] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#d4a533] to-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      </div>

      {/* Loan info */}
      <div className="bg-[#111827] rounded-xl border border-[#1e293b] p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Detalles del Préstamo</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-500 text-xs">Tasa</span><p className="text-gray-200 font-medium">{loan.interest_rate}% {TYPE_LABELS[loan.interest_type]}</p></div>
          <div><span className="text-gray-500 text-xs">Cuotas</span><p className="text-gray-200 font-medium">{loan.num_installments}</p></div>
          <div><span className="text-gray-500 text-xs">Valor Cuota</span><p className="text-gray-200 font-medium">{fmt(loan.installment_amount)}</p></div>
          <div><span className="text-gray-500 text-xs">Inicio</span><p className="text-gray-200 font-medium">{loan.start_date}</p></div>
          <div><span className="text-gray-500 text-xs">Vencimiento</span><p className="text-gray-200 font-medium">{loan.due_date}</p></div>
          <div><span className="text-gray-500 text-xs">Mora</span><p className="text-gray-200 font-medium">{loan.late_interest}% · {loan.grace_days} días gracia</p></div>
        </div>
      </div>

      {/* Payment schedule */}
      {loan.payment_schedule && loan.payment_schedule.length > 0 && (
        <div className="bg-[#111827] rounded-xl border border-[#1e293b] p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Calendario de Pagos</h3>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#111827]">
                <tr className="text-gray-500 border-b border-[#1e293b]">
                  <th className="text-left p-2">#</th>
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-right p-2">Monto</th>
                  <th className="text-center p-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {loan.payment_schedule.map((s, i) => {
                  const today = new Date().toISOString().split('T')[0];
                  const isPaid = payments.length > i;
                  const isLate = !isPaid && s.due_date < today;
                  return (
                    <tr key={i} className="border-b border-[#1e293b]/50">
                      <td className="p-2 text-gray-400">{s.installment_number}</td>
                      <td className="p-2 text-gray-300">{s.due_date}</td>
                      <td className="p-2 text-right text-gray-300">{fmt(s.amount)}</td>
                      <td className="p-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isPaid ? 'bg-emerald-500/10 text-emerald-400' : isLate ? 'bg-red-500/10 text-red-400' : 'bg-gray-500/10 text-gray-500'}`}>
                          {isPaid ? 'Pagado' : isLate ? 'Atrasado' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment history */}
      <div className="bg-[#111827] rounded-xl border border-[#1e293b] p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Historial de Pagos</h3>
        {payments.length > 0 ? (
          <div className="space-y-2">
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-[#1e293b]/50">
                <div>
                  <p className="text-sm font-medium text-gray-200">{fmt(p.amount)}</p>
                  <p className="text-xs text-gray-500">{p.payment_date} · {p.payment_type === 'full' ? 'Pago completo' : 'Pago parcial'}</p>
                  {p.notes && <p className="text-xs text-gray-600 mt-0.5">{p.notes}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => generateReceipt(p)} title="Imprimir recibo" className="text-[#d4a533] hover:text-[#b8922d] p-2">
                    <FileText className="w-4 h-4" />
                  </button>
                  <button onClick={() => downloadReceiptAsImage(p)} title="Descargar imagen" className="text-emerald-400 hover:text-emerald-300 p-2">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 py-6 text-sm">Sin pagos registrados</p>
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-gray-200 max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePay} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Monto a pagar *</label>
              <Input type="number" min="0.01" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} required className="bg-[#0a0e17] border-[#1e293b] text-gray-200" placeholder="0.00" />
              <p className="text-xs text-gray-600 mt-1">Saldo pendiente: {fmt(loan.remaining_balance)}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Notas</label>
              <Textarea value={payNotes} onChange={e => setPayNotes(e.target.value)} className="bg-[#0a0e17] border-[#1e293b] text-gray-200" rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPayDialogOpen(false)} className="border-[#1e293b] text-gray-400">Cancelar</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={payMutation.isPending}>Registrar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}