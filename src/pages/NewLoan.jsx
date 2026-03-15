import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { addDays, addWeeks, addMonths, format } from 'date-fns';
import { Calculator, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const INTEREST_LABELS = { daily: 'Diario', weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };

function generateSchedule(startDate, numInstallments, interestType, installmentAmount) {
  const schedule = [];
  let current = new Date(startDate);
  for (let i = 1; i <= numInstallments; i++) {
    let dueDate;
    if (interestType === 'daily') dueDate = addDays(current, i);
    else if (interestType === 'weekly') dueDate = addWeeks(current, i);
    else if (interestType === 'biweekly') dueDate = addDays(current, i * 15);
    else dueDate = addMonths(current, i);
    schedule.push({ installment_number: i, due_date: format(dueDate, 'yyyy-MM-dd'), amount: installmentAmount, status: 'pending' });
  }
  return schedule;
}

export default function NewLoan() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 200),
  });

  const [form, setForm] = useState({
    client_id: '', amount: '', interest_rate: '', interest_type: 'monthly',
    start_date: format(new Date(), 'yyyy-MM-dd'), num_installments: '',
    late_interest: '5', grace_days: '3'
  });

  const calc = useMemo(() => {
    const amount = parseFloat(form.amount) || 0;
    const rate = parseFloat(form.interest_rate) || 0;
    const installments = parseInt(form.num_installments) || 0;
    if (!amount || !rate || !installments) return null;
    const totalInterest = amount * (rate / 100) * installments;
    const totalToPay = amount + totalInterest;
    const installmentAmount = totalToPay / installments;
    const schedule = generateSchedule(form.start_date, installments, form.interest_type, Math.round(installmentAmount * 100) / 100);
    const dueDate = schedule.length ? schedule[schedule.length - 1].due_date : form.start_date;
    return { totalInterest, totalToPay, installmentAmount: Math.round(installmentAmount * 100) / 100, schedule, dueDate };
  }, [form.amount, form.interest_rate, form.num_installments, form.interest_type, form.start_date]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Loan.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Préstamo creado exitosamente');
      navigate('/Loans');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!calc) return;
    const client = clients.find(c => c.id === form.client_id);
    createMutation.mutate({
      client_id: form.client_id,
      client_name: client ? `${client.first_name} ${client.last_name}` : '',
      amount: parseFloat(form.amount),
      interest_rate: parseFloat(form.interest_rate),
      interest_type: form.interest_type,
      start_date: form.start_date,
      due_date: calc.dueDate,
      num_installments: parseInt(form.num_installments),
      late_interest: parseFloat(form.late_interest) || 0,
      grace_days: parseInt(form.grace_days) || 0,
      total_interest: calc.totalInterest,
      total_to_pay: calc.totalToPay,
      installment_amount: calc.installmentAmount,
      total_paid: 0,
      remaining_balance: calc.totalToPay,
      status: 'active',
      payment_schedule: calc.schedule,
    });
  };

  const fmt = (n) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/Loans" className="p-2 rounded-lg hover:bg-white/5 text-gray-500"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Nuevo Préstamo</h1>
          <p className="text-sm text-gray-500 mt-0.5">Complete los datos del préstamo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#111827] rounded-xl border border-[#1e293b] p-6 space-y-5">
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Cliente *</label>
          <Select value={form.client_id} onValueChange={v => setForm(p => ({ ...p, client_id: v }))}>
            <SelectTrigger className="bg-[#0a0e17] border-[#1e293b] text-gray-200">
              <SelectValue placeholder="Seleccionar cliente" />
            </SelectTrigger>
            <SelectContent className="bg-[#1f2937] border-[#374151] text-gray-200">
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name} — {c.id_number}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Monto del Préstamo *</label>
            <Input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required className="bg-[#0a0e17] border-[#1e293b] text-gray-200" placeholder="0.00" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Tasa de Interés (%) *</label>
            <Input type="number" min="0" step="0.01" value={form.interest_rate} onChange={e => setForm(p => ({ ...p, interest_rate: e.target.value }))} required className="bg-[#0a0e17] border-[#1e293b] text-gray-200" placeholder="0.00" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Tipo de Interés *</label>
            <Select value={form.interest_type} onValueChange={v => setForm(p => ({ ...p, interest_type: v }))}>
              <SelectTrigger className="bg-[#0a0e17] border-[#1e293b] text-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1f2937] border-[#374151] text-gray-200">
                {Object.entries(INTEREST_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Número de Cuotas *</label>
            <Input type="number" min="1" value={form.num_installments} onChange={e => setForm(p => ({ ...p, num_installments: e.target.value }))} required className="bg-[#0a0e17] border-[#1e293b] text-gray-200" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Fecha de Inicio *</label>
            <Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} required className="bg-[#0a0e17] border-[#1e293b] text-gray-200" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Interés por Mora (%)</label>
            <Input type="number" min="0" step="0.01" value={form.late_interest} onChange={e => setForm(p => ({ ...p, late_interest: e.target.value }))} className="bg-[#0a0e17] border-[#1e293b] text-gray-200" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Días de Gracia</label>
            <Input type="number" min="0" value={form.grace_days} onChange={e => setForm(p => ({ ...p, grace_days: e.target.value }))} className="bg-[#0a0e17] border-[#1e293b] text-gray-200" />
          </div>
        </div>

        {/* Calculation preview */}
        {calc && (
          <div className="bg-[#0a0e17] rounded-xl border border-[#d4a533]/20 p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#d4a533] text-sm font-semibold">
              <Calculator className="w-4 h-4" /> Resumen del Préstamo
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Interés Total</p>
                <p className="text-lg font-bold text-[#d4a533]">{fmt(calc.totalInterest)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total a Pagar</p>
                <p className="text-lg font-bold text-emerald-400">{fmt(calc.totalToPay)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Valor Cuota</p>
                <p className="text-lg font-bold text-blue-400">{fmt(calc.installmentAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Vencimiento</p>
                <p className="text-lg font-bold text-gray-300">{format(new Date(calc.dueDate), 'dd/MM/yy')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Schedule preview */}
        {calc && calc.schedule.length > 0 && (
          <div className="max-h-48 overflow-y-auto rounded-lg border border-[#1e293b]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#111827]">
                <tr className="text-gray-500 border-b border-[#1e293b]">
                  <th className="text-left p-2">#</th>
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-right p-2">Monto</th>
                </tr>
              </thead>
              <tbody>
                {calc.schedule.map(s => (
                  <tr key={s.installment_number} className="border-b border-[#1e293b]/50">
                    <td className="p-2 text-gray-400">{s.installment_number}</td>
                    <td className="p-2 text-gray-300">{format(new Date(s.due_date), 'dd/MM/yyyy')}</td>
                    <td className="p-2 text-right text-gray-300">{fmt(s.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/Loans')} className="border-[#1e293b] text-gray-400 hover:bg-white/5">Cancelar</Button>
          <Button type="submit" disabled={!calc || !form.client_id || createMutation.isPending} className="bg-[#d4a533] hover:bg-[#b8922d] text-black font-semibold">
            Crear Préstamo
          </Button>
        </div>
      </form>
    </div>
  );
}