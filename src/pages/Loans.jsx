import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Trash2 } from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingLoan, setDeletingLoan] = useState(null);

  const queryClient = useQueryClient();

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
                      <td className="p-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status]}`}>
                          {STATUS_TEXT[status]}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link to={`/LoanDetail?id=${l.id}`} className="inline-flex items-center gap-1 text-xs text-[#d4a533] hover:underline">
                            <Eye className="w-3.5 h-3.5" /> Ver
                          </Link>
                          <button onClick={() => { setDeletingLoan(l); setDeleteOpen(true); }} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-12 text-gray-600">No hay préstamos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-[#111827] border-[#1e293b] text-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar préstamo?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Se eliminará el préstamo de <strong className="text-gray-300">{deletingLoan?.client_name}</strong> junto con todo su historial de pagos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1e293b] text-gray-400 hover:bg-white/5">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deletingLoan)} className="bg-red-600 hover:bg-red-700" disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}