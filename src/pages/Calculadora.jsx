import React, { useState, useMemo } from 'react';
import { Calculator, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { addDays, addWeeks, addMonths, format } from 'date-fns';

const INTEREST_LABELS = { daily: 'Diario', weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };

function generateSchedule(startDate, numInstallments, interestType, installmentAmount) {
  const schedule = [];
  const current = new Date(startDate);
  for (let i = 1; i <= numInstallments; i++) {
    let dueDate;
    if (interestType === 'daily') dueDate = addDays(current, i);
    else if (interestType === 'weekly') dueDate = addWeeks(current, i);
    else if (interestType === 'biweekly') dueDate = addDays(current, i * 15);
    else dueDate = addMonths(current, i);
    schedule.push({ num: i, due_date: format(dueDate, 'yyyy-MM-dd'), amount: installmentAmount });
  }
  return schedule;
}

const DEFAULT = {
  amount: '', interest_rate: '', interest_type: 'monthly',
  num_installments: '', start_date: format(new Date(), 'yyyy-MM-dd'),
};

export default function Calculadora() {
  const [form, setForm] = useState(DEFAULT);
  const fmt = (n) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n);

  const calc = useMemo(() => {
    const amount = parseFloat(form.amount) || 0;
    const rate = parseFloat(form.interest_rate) || 0;
    const installments = parseInt(form.num_installments) || 0;
    if (!amount || !rate || !installments) return null;
    const totalInterest = amount * (rate / 100) * installments;
    const totalToPay = amount + totalInterest;
    const installmentAmount = Math.round((totalToPay / installments) * 100) / 100;
    const schedule = generateSchedule(form.start_date, installments, form.interest_type, installmentAmount);
    const dueDate = schedule.length ? schedule[schedule.length - 1].due_date : form.start_date;
    return { totalInterest, totalToPay, installmentAmount, schedule, dueDate };
  }, [form]);

  const reset = () => setForm(DEFAULT);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Calculadora de Préstamo</h1>
          <p className="text-sm text-gray-500 mt-0.5">Simula un préstamo sin guardarlo</p>
        </div>
        <Button variant="outline" onClick={reset} className="border-[#1e293b] text-gray-400 hover:bg-white/5">
          <RotateCcw className="w-4 h-4 mr-2" /> Limpiar
        </Button>
      </div>

      {/* Inputs */}
      <div className="bg-[#111827] rounded-xl border border-[#1e293b] p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Monto del Préstamo</label>
            <Input type="number" min="0" step="0.01" value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              className="bg-[#0a0e17] border-[#1e293b] text-gray-200" placeholder="0.00" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Tasa de Interés (%)</label>
            <Input type="number" min="0" step="0.01" value={form.interest_rate}
              onChange={e => setForm(p => ({ ...p, interest_rate: e.target.value }))}
              className="bg-[#0a0e17] border-[#1e293b] text-gray-200" placeholder="0.00" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Tipo de Interés</label>
            <Select value={form.interest_type || undefined} onValueChange={v => setForm(p => ({ ...p, interest_type: v }))}>
              <SelectTrigger className="bg-[#0a0e17] border-[#1e293b] text-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1f2937] border-[#374151] text-gray-200">
                {Object.entries(INTEREST_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Número de Cuotas</label>
            <Input type="number" min="1" value={form.num_installments}
              onChange={e => setForm(p => ({ ...p, num_installments: e.target.value }))}
              className="bg-[#0a0e17] border-[#1e293b] text-gray-200" placeholder="0" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Fecha de Inicio</label>
            <Input type="date" value={form.start_date}
              onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
              className="bg-[#0a0e17] border-[#1e293b] text-gray-200" />
          </div>
        </div>
      </div>

      {/* Result Summary */}
      {calc && (
        <div className="bg-[#0a0e17] rounded-xl border border-[#d4a533]/30 p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#d4a533] font-semibold">
            <Calculator className="w-4 h-4" /> Resultado del Cálculo
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-[#111827] rounded-xl p-4 border border-[#1e293b]">
              <p className="text-xs text-gray-500 mb-1">Capital</p>
              <p className="text-lg font-bold text-blue-400">{fmt(parseFloat(form.amount))}</p>
            </div>
            <div className="bg-[#111827] rounded-xl p-4 border border-[#1e293b]">
              <p className="text-xs text-gray-500 mb-1">Interés Total</p>
              <p className="text-lg font-bold text-[#d4a533]">{fmt(calc.totalInterest)}</p>
            </div>
            <div className="bg-[#111827] rounded-xl p-4 border border-[#1e293b]">
              <p className="text-xs text-gray-500 mb-1">Total a Pagar</p>
              <p className="text-lg font-bold text-emerald-400">{fmt(calc.totalToPay)}</p>
            </div>
            <div className="bg-[#111827] rounded-xl p-4 border border-[#1e293b]">
              <p className="text-xs text-gray-500 mb-1">Valor Cuota</p>
              <p className="text-lg font-bold text-gray-200">{fmt(calc.installmentAmount)}</p>
            </div>
          </div>
          <div className="text-center text-sm text-gray-500">
            Fecha de vencimiento: <span className="text-gray-300 font-medium">{calc.dueDate}</span>
          </div>
        </div>
      )}

      {/* Schedule */}
      {calc && calc.schedule.length > 0 && (
        <div className="bg-[#111827] rounded-xl border border-[#1e293b] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#1e293b]">
            <h3 className="text-sm font-semibold text-gray-300">Calendario de Pagos</h3>
          </div>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#111827]">
                <tr className="text-gray-500 text-xs border-b border-[#1e293b]">
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Fecha de Vencimiento</th>
                  <th className="text-right p-3">Monto</th>
                </tr>
              </thead>
              <tbody>
                {calc.schedule.map(s => (
                  <tr key={s.num} className="border-b border-[#1e293b]/50 hover:bg-white/[0.02]">
                    <td className="p-3 text-gray-400">{s.num}</td>
                    <td className="p-3 text-gray-300">{format(new Date(s.due_date), 'dd/MM/yyyy')}</td>
                    <td className="p-3 text-right text-emerald-400 font-medium">{fmt(s.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}