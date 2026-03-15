import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, AlertTriangle, HandCoins } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORS = ['#d4a533', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

export default function Reports() {
  const { data: loans = [] } = useQuery({ queryKey: ['loans'], queryFn: () => base44.entities.Loan.list('-created_date', 500) });
  const { data: payments = [] } = useQuery({ queryKey: ['payments'], queryFn: () => base44.entities.Payment.list('-created_date', 1000) });

  const today = new Date().toISOString().split('T')[0];
  const activeLoans = loans.filter(l => l.status === 'active');
  const overdueLoans = loans.filter(l => l.status === 'overdue' || (l.status === 'active' && l.due_date && l.due_date < today));
  const totalLent = loans.reduce((s, l) => s + (l.amount || 0), 0);
  const totalInterest = loans.reduce((s, l) => s + (l.total_interest || 0), 0);
  const totalCollected = payments.reduce((s, p) => s + (p.amount || 0), 0);

  const monthlyIncome = useMemo(() => {
    const months = {};
    payments.forEach(p => {
      if (p.payment_date) {
        const m = p.payment_date.substring(0, 7);
        months[m] = (months[m] || 0) + (p.amount || 0);
      }
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([m, a]) => ({
      name: format(parseISO(m + '-01'), 'MMM yy', { locale: es }), amount: a
    }));
  }, [payments]);

  const monthlyLoans = useMemo(() => {
    const months = {};
    loans.forEach(l => {
      if (l.start_date) {
        const m = l.start_date.substring(0, 7);
        months[m] = (months[m] || 0) + (l.amount || 0);
      }
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([m, a]) => ({
      name: format(parseISO(m + '-01'), 'MMM yy', { locale: es }), amount: a
    }));
  }, [loans]);

  const interestByType = useMemo(() => {
    const types = {};
    loans.forEach(l => {
      const label = { daily: 'Diario', weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' }[l.interest_type] || 'Otro';
      types[label] = (types[label] || 0) + (l.total_interest || 0);
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [loans]);

  const fmt = (n) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n);
  const tooltipStyle = { background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#e5e7eb' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Reportes</h1>
        <p className="text-sm text-gray-500 mt-1">Análisis financiero de Inversiones CTEC</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Prestado" value={fmt(totalLent)} color="blue" />
        <StatCard icon={TrendingUp} label="Intereses Generados" value={fmt(totalInterest)} color="gold" />
        <StatCard icon={HandCoins} label="Total Cobrado" value={fmt(totalCollected)} color="emerald" />
        <StatCard icon={AlertTriangle} label="Morosidad" value={`${overdueLoans.length} préstamos`} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111827] rounded-xl border border-[#1e293b] p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Ingresos Mensuales</h3>
          {monthlyIncome.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyIncome}>
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmt(v), 'Ingreso']} />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[240px] flex items-center justify-center text-gray-600 text-sm">Sin datos</div>}
        </div>

        <div className="bg-[#111827] rounded-xl border border-[#1e293b] p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Préstamos Otorgados</h3>
          {monthlyLoans.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyLoans}>
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmt(v), 'Prestado']} />
                <Line type="monotone" dataKey="amount" stroke="#d4a533" strokeWidth={2} dot={{ fill: '#d4a533', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="h-[240px] flex items-center justify-center text-gray-600 text-sm">Sin datos</div>}
        </div>

        <div className="bg-[#111827] rounded-xl border border-[#1e293b] p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Intereses por Tipo</h3>
          {interestByType.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={interestByType} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {interestByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmt(v), 'Interés']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {interestByType.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </>
          ) : <div className="h-[200px] flex items-center justify-center text-gray-600 text-sm">Sin datos</div>}
        </div>

        <div className="bg-[#111827] rounded-xl border border-[#1e293b] p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Resumen de Cartera</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02]">
              <span className="text-sm text-gray-400">Capital en circulación</span>
              <span className="text-sm font-bold text-gray-200">{fmt(totalLent - totalCollected + totalInterest)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02]">
              <span className="text-sm text-gray-400">Tasa de recuperación</span>
              <span className="text-sm font-bold text-emerald-400">{totalLent ? ((totalCollected / (totalLent + totalInterest)) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02]">
              <span className="text-sm text-gray-400">Préstamos activos</span>
              <span className="text-sm font-bold text-[#d4a533]">{activeLoans.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02]">
              <span className="text-sm text-gray-400">Tasa de morosidad</span>
              <span className="text-sm font-bold text-red-400">{loans.length ? ((overdueLoans.length / loans.length) * 100).toFixed(1) : 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}