import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { HandCoins, DollarSign, TrendingUp, AlertTriangle, Users, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '@/components/dashboard/StatCard';
import { format, isAfter, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const COLORS = ['#d4a533', '#10b981', '#3b82f6', '#ef4444'];

export default function Dashboard() {
  const { data: loans = [], isLoading: loansLoading } = useQuery({
    queryKey: ['loans'],
    queryFn: () => base44.entities.Loan.list('-created_date', 200),
  });
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list('-created_date', 500),
  });
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 200),
  });

  const today = new Date().toISOString().split('T')[0];
  const activeLoans = loans.filter(l => l.status === 'active');
  const paidLoans = loans.filter(l => l.status === 'paid');
  const overdueLoans = loans.filter(l => l.status === 'overdue' || (l.status === 'active' && l.due_date && l.due_date < today));
  const totalLent = loans.reduce((s, l) => s + (l.amount || 0), 0);
  const totalCollected = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalInterest = loans.reduce((s, l) => s + (l.total_interest || 0), 0);

  const statusData = [
    { name: 'Activos', value: activeLoans.length },
    { name: 'Pagados', value: paidLoans.length },
    { name: 'Vencidos', value: overdueLoans.length },
  ].filter(d => d.value > 0);

  // Monthly collected data
  const monthlyData = React.useMemo(() => {
    const months = {};
    payments.forEach(p => {
      if (p.payment_date) {
        const m = p.payment_date.substring(0, 7);
        months[m] = (months[m] || 0) + (p.amount || 0);
      }
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => ({
        name: format(parseISO(month + '-01'), 'MMM', { locale: es }),
        amount
      }));
  }, [payments]);

  const isLoading = loansLoading || paymentsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#d4a533]/30 border-t-[#d4a533] rounded-full animate-spin" />
      </div>
    );
  }

  const fmt = (n) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen general de Inversiones CTEC</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={HandCoins} label="Préstamos Activos" value={activeLoans.length} color="gold" />
        <StatCard icon={DollarSign} label="Total Prestado" value={fmt(totalLent)} color="blue" />
        <StatCard icon={TrendingUp} label="Total Cobrado" value={fmt(totalCollected)} color="emerald" />
        <StatCard icon={AlertTriangle} label="Vencidos" value={overdueLoans.length} color="red" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Clientes" value={clients.length} color="blue" />
        <StatCard icon={TrendingUp} label="Intereses Generados" value={fmt(totalInterest)} color="gold" />
        <StatCard icon={Clock} label="Saldo Pendiente" value={fmt(totalLent + totalInterest - totalCollected)} color="red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111827] rounded-xl border border-[#1e293b] p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Cobros Mensuales</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#e5e7eb' }}
                  formatter={(v) => [fmt(v), 'Cobrado']}
                />
                <Bar dataKey="amount" fill="#d4a533" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-600 text-sm">Sin datos aún</div>
          )}
        </div>

        <div className="bg-[#111827] rounded-xl border border-[#1e293b] p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Estado de Préstamos</h3>
          {statusData.length > 0 ? (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#e5e7eb' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-600 text-sm">Sin datos aún</div>
          )}
          <div className="flex justify-center gap-6 mt-2">
            {statusData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent loans */}
      <div className="bg-[#111827] rounded-xl border border-[#1e293b] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-300">Préstamos Recientes</h3>
          <Link to="/Loans" className="text-xs text-[#d4a533] hover:underline">Ver todos</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-[#1e293b]">
                <th className="text-left py-2 font-medium">Cliente</th>
                <th className="text-right py-2 font-medium">Monto</th>
                <th className="text-right py-2 font-medium">Total</th>
                <th className="text-center py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loans.slice(0, 5).map(loan => (
                <tr key={loan.id} className="border-b border-[#1e293b]/50 hover:bg-white/[0.02]">
                  <td className="py-2.5">{loan.client_name || '—'}</td>
                  <td className="py-2.5 text-right">{fmt(loan.amount)}</td>
                  <td className="py-2.5 text-right">{fmt(loan.total_to_pay)}</td>
                  <td className="py-2.5 text-center">
                    <span className={`
                      text-xs px-2 py-0.5 rounded-full font-medium
                      ${loan.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : ''}
                      ${loan.status === 'paid' ? 'bg-blue-500/10 text-blue-400' : ''}
                      ${loan.status === 'overdue' ? 'bg-red-500/10 text-red-400' : ''}
                      ${loan.status === 'defaulted' ? 'bg-orange-500/10 text-orange-400' : ''}
                    `}>
                      {loan.status === 'active' ? 'Activo' : loan.status === 'paid' ? 'Pagado' : loan.status === 'overdue' ? 'Vencido' : 'Moroso'}
                    </span>
                  </td>
                </tr>
              ))}
              {loans.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-gray-600">No hay préstamos registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}