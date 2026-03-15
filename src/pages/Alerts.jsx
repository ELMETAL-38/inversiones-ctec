import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, Bell, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { differenceInDays, parseISO } from 'date-fns';

export default function Alerts() {
  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['loans'],
    queryFn: () => base44.entities.Loan.list('-created_date', 200),
  });

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const overdueLoans = loans.filter(l => 
    (l.status === 'active' || l.status === 'overdue') && l.due_date && l.due_date < todayStr
  );

  const upcomingLoans = loans.filter(l => {
    if (l.status !== 'active' || !l.payment_schedule) return false;
    return l.payment_schedule.some(s => {
      const daysUntil = differenceInDays(parseISO(s.due_date), today);
      return s.status === 'pending' && daysUntil >= 0 && daysUntil <= 7;
    });
  });

  const defaultedLoans = loans.filter(l => {
    if (l.status !== 'active') return false;
    const overdueDays = l.due_date ? differenceInDays(today, parseISO(l.due_date)) : 0;
    return overdueDays > 30;
  });

  const fmt = (n) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n || 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#d4a533]/30 border-t-[#d4a533] rounded-full animate-spin" />
      </div>
    );
  }

  const sections = [
    {
      title: 'Pagos Vencidos',
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      items: overdueLoans,
      emptyText: 'No hay pagos vencidos',
    },
    {
      title: 'Próximos Pagos (7 días)',
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      items: upcomingLoans,
      emptyText: 'No hay pagos próximos',
    },
    {
      title: 'Clientes Morosos (+30 días)',
      icon: Bell,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      items: defaultedLoans,
      emptyText: 'No hay clientes morosos',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Alertas</h1>
        <p className="text-sm text-gray-500 mt-1">Notificaciones y alertas del sistema</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sections.map(s => (
          <div key={s.title} className={`${s.bgColor} rounded-xl border ${s.borderColor} p-4 flex items-center gap-3`}>
            <div className={`p-2 rounded-lg bg-white/5`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-100">{s.items.length}</p>
              <p className="text-xs text-gray-500">{s.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Detail sections */}
      {sections.map(section => (
        <div key={section.title} className="bg-[#111827] rounded-xl border border-[#1e293b] overflow-hidden">
          <div className={`px-5 py-3 border-b border-[#1e293b] flex items-center gap-2`}>
            <section.icon className={`w-4 h-4 ${section.color}`} />
            <h3 className="text-sm font-semibold text-gray-300">{section.title}</h3>
            <span className={`text-xs ml-auto px-2 py-0.5 rounded-full ${section.bgColor} ${section.color}`}>{section.items.length}</span>
          </div>
          {section.items.length > 0 ? (
            <div className="divide-y divide-[#1e293b]/50">
              {section.items.map(l => (
                <div key={l.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02]">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{l.client_name}</p>
                    <p className="text-xs text-gray-500">
                      {fmt(l.remaining_balance)} pendiente · Vence: {l.due_date}
                    </p>
                  </div>
                  <Link to={`/LoanDetail?id=${l.id}`} className="text-[#d4a533] hover:text-[#b8922d] p-2">
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-gray-600 text-sm">{section.emptyText}</div>
          )}
        </div>
      ))}
    </div>
  );
}