import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Caja() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [form, setForm] = useState({ type: 'entrada', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });

  const queryClient = useQueryClient();
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['capital'],
    queryFn: () => base44.entities.Capital.list('-date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Capital.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital'] });
      setDialogOpen(false);
      setForm({ type: 'entrada', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
      toast.success('Movimiento registrado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Capital.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital'] });
      setDeleteOpen(false);
      toast.success('Movimiento eliminado');
    },
  });

  const totalEntradas = movements.filter(m => m.type === 'entrada').reduce((s, m) => s + (m.amount || 0), 0);
  const totalSalidas = movements.filter(m => m.type === 'salida').reduce((s, m) => s + (m.amount || 0), 0);
  const saldo = totalEntradas - totalSalidas;

  const fmt = (n) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, amount: parseFloat(form.amount) });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Caja / Capital</h1>
          <p className="text-sm text-gray-500 mt-1">Registro de entradas y salidas de capital</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-[#d4a533] hover:bg-[#b8922d] text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Movimiento
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl border border-emerald-500/20 p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-white/5">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Entradas</p>
            <p className="text-xl font-bold text-gray-100 mt-1">{fmt(totalEntradas)}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl border border-red-500/20 p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-white/5">
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Salidas</p>
            <p className="text-xl font-bold text-gray-100 mt-1">{fmt(totalSalidas)}</p>
          </div>
        </div>
        <div className={`bg-gradient-to-br rounded-xl border p-5 flex items-center gap-4 ${saldo >= 0 ? 'from-[#d4a533]/10 to-[#d4a533]/5 border-[#d4a533]/20' : 'from-red-500/10 to-red-500/5 border-red-500/20'}`}>
          <div className="p-2.5 rounded-lg bg-white/5">
            <Wallet className={`w-5 h-5 ${saldo >= 0 ? 'text-[#d4a533]' : 'text-red-400'}`} />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Saldo Actual</p>
            <p className={`text-xl font-bold mt-1 ${saldo >= 0 ? 'text-[#d4a533]' : 'text-red-400'}`}>{fmt(saldo)}</p>
          </div>
        </div>
      </div>

      {/* Table */}
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
                  <th className="text-left p-3 font-medium">Fecha</th>
                  <th className="text-left p-3 font-medium">Descripción</th>
                  <th className="text-center p-3 font-medium">Tipo</th>
                  <th className="text-right p-3 font-medium">Monto</th>
                  <th className="text-center p-3 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(m => (
                  <tr key={m.id} className="border-b border-[#1e293b]/50 hover:bg-white/[0.02]">
                    <td className="p-3 text-gray-400">{m.date}</td>
                    <td className="p-3 text-gray-300">{m.description || '—'}</td>
                    <td className="p-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.type === 'entrada' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {m.type === 'entrada' ? '↑ Entrada' : '↓ Salida'}
                      </span>
                    </td>
                    <td className={`p-3 text-right font-semibold ${m.type === 'entrada' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.type === 'entrada' ? '+' : '-'}{fmt(m.amount)}
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => { setDeletingItem(m); setDeleteOpen(true); }} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {movements.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-600">No hay movimientos registrados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-gray-200 max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo Movimiento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Tipo *</label>
              <div className="flex gap-2">
                {['entrada', 'salida'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, type: t }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.type === t
                      ? t === 'entrada' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-red-500/15 border-red-500/40 text-red-400'
                      : 'border-[#1e293b] text-gray-500 hover:bg-white/5'}`}
                  >
                    {t === 'entrada' ? '↑ Entrada' : '↓ Salida'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Monto *</label>
              <Input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required className="bg-[#0a0e17] border-[#1e293b] text-gray-200" placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Fecha *</label>
              <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required className="bg-[#0a0e17] border-[#1e293b] text-gray-200" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Descripción</label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="bg-[#0a0e17] border-[#1e293b] text-gray-200" rows={2} placeholder="Ej: Depósito inicial, retiro de socio..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-[#1e293b] text-gray-400">Cancelar</Button>
              <Button type="submit" className="bg-[#d4a533] hover:bg-[#b8922d] text-black font-semibold" disabled={createMutation.isPending}>Registrar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-[#111827] border-[#1e293b] text-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar movimiento?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Se eliminará el registro de <strong className="text-gray-300">{fmt(deletingItem?.amount)}</strong> del {deletingItem?.date}. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1e293b] text-gray-400 hover:bg-white/5">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deletingItem?.id)} className="bg-red-600 hover:bg-red-700" disabled={deleteMutation.isPending}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}