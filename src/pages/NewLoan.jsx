import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { addDays, addWeeks, addMonths, format } from 'date-fns';
import { Calculator, ArrowLeft, FileDown, Image } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Link } from 'react-router-dom';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_69b62672be45da00af3df17b/0d96f8146_LogodeinversionesCTEC.png";

function generateLoanPDF(loanData, client, calc, fmt) {
  const { form } = loanData;
  const scheduleRows = calc.schedule.map(s => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:center;">${s.installment_number}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:center;">${s.due_date}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:right;">RD$ ${s.amount.toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <html><head>
    <meta charset="UTF-8">
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 30px; font-size: 13px; }
      .header { display:flex; align-items:center; gap:16px; border-bottom: 3px solid #d4a533; padding-bottom: 16px; margin-bottom: 20px; }
      .logo { width:70px; height:70px; object-fit:contain; }
      .company h1 { color:#d4a533; font-size:22px; font-weight:bold; letter-spacing:1px; }
      .company p { color:#555; font-size:11px; margin-top:2px; }
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
      .gold { color:#d4a533; }
      .green { color:#10b981; }
      .blue { color:#3b82f6; }
      table { width:100%; border-collapse:collapse; font-size:12px; }
      thead tr { background:#d4a533; color:#fff; }
      thead th { padding:8px; text-align:center; }
      tbody tr:nth-child(even) { background:#fafafa; }
      .footer { text-align:center; margin-top:24px; padding-top:14px; border-top:2px solid #d4a533; color:#888; font-size:11px; }
      .footer strong { color:#d4a533; }
      .signature-area { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:30px; }
      .sig-box { text-align:center; border-top:1px solid #999; padding-top:6px; color:#555; font-size:11px; }
    </style>
    </head><body>
      <div class="header">
        <img src="${LOGO_URL}" class="logo" />
        <div class="company">
          <h1>INVERSIONES CTEC</h1>
          <p>Servicios Financieros · República Dominicana</p>
        </div>
        <div style="margin-left:auto;text-align:right;font-size:11px;color:#888;">
          <p>Fecha: ${new Date().toLocaleDateString('es-DO')}</p>
          <p>Contrato de Préstamo</p>
        </div>
      </div>

      <div class="doc-title">📄 CONTRATO DE PRÉSTAMO</div>

      <div class="section">
        <div class="section-title">Datos del Cliente</div>
        <div class="info-grid">
          <div class="info-item"><span>Nombre:</span><span>${client?.first_name} ${client?.last_name}</span></div>
          <div class="info-item"><span>Cédula / ID:</span><span>${client?.id_number || '—'}</span></div>
          <div class="info-item"><span>Teléfono:</span><span>${client?.phone || '—'}</span></div>
          <div class="info-item"><span>Dirección:</span><span>${client?.address || '—'}</span></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Condiciones del Préstamo</div>
        <div class="info-grid">
          <div class="info-item"><span>Monto Prestado:</span><span>${fmt(parseFloat(form.amount))}</span></div>
          <div class="info-item"><span>Tasa de Interés:</span><span>${form.interest_rate}% ${INTEREST_LABELS[form.interest_type]}</span></div>
          <div class="info-item"><span>Número de Cuotas:</span><span>${form.num_installments}</span></div>
          <div class="info-item"><span>Valor por Cuota:</span><span>${fmt(calc.installmentAmount)}</span></div>
          <div class="info-item"><span>Fecha de Inicio:</span><span>${form.start_date}</span></div>
          <div class="info-item"><span>Fecha de Vencimiento:</span><span>${calc.dueDate}</span></div>
          <div class="info-item"><span>Interés por Mora:</span><span>${form.late_interest}%</span></div>
          <div class="info-item"><span>Días de Gracia:</span><span>${form.grace_days} días</span></div>
        </div>
      </div>

      <div class="totals-box">
        <div class="totals-grid">
          <div class="total-item"><p>Capital</p><p class="blue">${fmt(parseFloat(form.amount))}</p></div>
          <div class="total-item"><p>Interés Total</p><p class="gold">${fmt(calc.totalInterest)}</p></div>
          <div class="total-item"><p>TOTAL A PAGAR</p><p class="green">${fmt(calc.totalToPay)}</p></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Calendario de Pagos</div>
        <table>
          <thead><tr><th>#</th><th>Fecha de Vencimiento</th><th>Monto</th></tr></thead>
          <tbody>${scheduleRows}</tbody>
        </table>
      </div>

      <div class="signature-area">
        <div class="sig-box">Firma del Prestatario<br/>${client?.first_name} ${client?.last_name}</div>
        <div class="sig-box">Firma Inversiones CTEC<br/>Autorizado</div>
      </div>

      <div class="footer">
        <strong>INVERSIONES CTEC</strong> — República Dominicana<br/>
        Este documento constituye un contrato de préstamo legalmente vinculante.
      </div>
    </body></html>
  `;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
}

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
    onSuccess: (_, variables) => {
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

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/Loans')} className="border-[#1e293b] text-gray-400 hover:bg-white/5">Cancelar</Button>
          {calc && form.client_id && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const client = clients.find(c => c.id === form.client_id);
                generateLoanPDF({ form }, client, calc, fmt);
              }}
              className="border-[#d4a533]/40 text-[#d4a533] hover:bg-[#d4a533]/10"
            >
              <FileDown className="w-4 h-4 mr-2" /> Vista Previa PDF
            </Button>
          )}
          {calc && form.client_id && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const client = clients.find(c => c.id === form.client_id);
                const win = window.open('', '_blank');
                win.document.write(`<!DOCTYPE html><html><head><style>
                  * { margin:0; padding:0; box-sizing:border-box; }
                  body { font-family: Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 30px; font-size: 13px; }
                  .header { display:flex; align-items:center; gap:16px; border-bottom: 3px solid #d4a533; padding-bottom: 16px; margin-bottom: 20px; }
                  .logo { width:70px; height:70px; object-fit:contain; }
                  .company h1 { color:#d4a533; font-size:22px; font-weight:bold; }
                  .company p { color:#555; font-size:11px; }
                  .doc-title { text-align:center; font-size:16px; font-weight:bold; color:#333; background:#f9f5ec; padding:10px; border-radius:6px; margin-bottom:20px; border:1px solid #e8d89a; }
                  .section-title { font-size:12px; font-weight:bold; color:#d4a533; text-transform:uppercase; border-bottom:1px solid #e8d89a; padding-bottom:4px; margin-bottom:10px; margin-top:16px; }
                  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
                  .info-item { display:flex; justify-content:space-between; padding:6px 10px; background:#f9f9f9; border-radius:4px; }
                  .totals-box { background:#fffbf0; border:2px solid #d4a533; border-radius:8px; padding:16px; margin:16px 0; display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; text-align:center; }
                  .total-item p:first-child { color:#888; font-size:11px; }
                  .total-item p:last-child { font-size:17px; font-weight:bold; margin-top:3px; }
                  table { width:100%; border-collapse:collapse; font-size:12px; margin-top:8px; }
                  thead tr { background:#d4a533; color:#fff; }
                  thead th { padding:8px; }
                  tbody tr:nth-child(even) { background:#fafafa; }
                  td { padding:6px 8px; border-bottom:1px solid #f0f0f0; text-align:center; }
                  .footer { text-align:center; margin-top:24px; padding-top:14px; border-top:2px solid #d4a533; color:#888; font-size:11px; }
                  .footer strong { color:#d4a533; }
                </style></head><body>
                  <div class="header">
                    <img src="${LOGO_URL}" class="logo" crossorigin="anonymous" />
                    <div class="company">
                      <h1>INVERSIONES CTEC</h1>
                      <p>Servicios Financieros · República Dominicana</p>
                    </div>
                  </div>
                  <div class="doc-title">📄 CONTRATO DE PRÉSTAMO</div>
                  <div class="section-title">Datos del Cliente</div>
                  <div class="info-grid">
                    <div class="info-item"><span>Nombre:</span><span>${client?.first_name} ${client?.last_name}</span></div>
                    <div class="info-item"><span>Cédula:</span><span>${client?.id_number || '—'}</span></div>
                    <div class="info-item"><span>Teléfono:</span><span>${client?.phone || '—'}</span></div>
                    <div class="info-item"><span>Dirección:</span><span>${client?.address || '—'}</span></div>
                  </div>
                  <div class="section-title">Condiciones del Préstamo</div>
                  <div class="info-grid">
                    <div class="info-item"><span>Monto:</span><span>${fmt(parseFloat(form.amount))}</span></div>
                    <div class="info-item"><span>Interés:</span><span>${form.interest_rate}% ${INTEREST_LABELS[form.interest_type]}</span></div>
                    <div class="info-item"><span>Cuotas:</span><span>${form.num_installments}</span></div>
                    <div class="info-item"><span>Valor Cuota:</span><span>${fmt(calc.installmentAmount)}</span></div>
                    <div class="info-item"><span>Inicio:</span><span>${form.start_date}</span></div>
                    <div class="info-item"><span>Vencimiento:</span><span>${calc.dueDate}</span></div>
                  </div>
                  <div class="totals-box">
                    <div class="total-item"><p>Capital</p><p style="color:#3b82f6">${fmt(parseFloat(form.amount))}</p></div>
                    <div class="total-item"><p>Interés Total</p><p style="color:#d4a533">${fmt(calc.totalInterest)}</p></div>
                    <div class="total-item"><p>TOTAL A PAGAR</p><p style="color:#10b981">${fmt(calc.totalToPay)}</p></div>
                  </div>
                  <div class="section-title">Calendario de Pagos</div>
                  <table>
                    <thead><tr><th>#</th><th>Fecha</th><th>Monto</th></tr></thead>
                    <tbody>${calc.schedule.map(s => `<tr><td>${s.installment_number}</td><td>${s.due_date}</td><td>RD$ ${s.amount.toFixed(2)}</td></tr>`).join('')}</tbody>
                  </table>
                  <div class="footer">
                    <strong>INVERSIONES CTEC</strong> — República Dominicana<br/>
                    Contacto WhatsApp: 809-462-2260
                  </div>
                </body></html>`);
                win.document.close();
                win.onload = () => {
                  html2canvas(win.document.body, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
                    const link = win.document.createElement('a');
                    link.download = `prestamo-${client?.first_name}_${client?.last_name}-${form.start_date}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    win.close();
                  });
                };
              }}
              className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
            >
              <Image className="w-4 h-4 mr-2" /> Descargar Imagen
            </Button>
          )}
          <Button type="submit" disabled={!calc || !form.client_id || createMutation.isPending} className="bg-[#d4a533] hover:bg-[#b8922d] text-black font-semibold">
            Crear Préstamo
          </Button>
        </div>
      </form>
    </div>
  );
}