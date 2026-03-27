import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, User, Phone, MapPin, IdCard, X, HandCoins, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function Clients() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deletingClient, setDeletingClient] = useState(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', address: '', id_number: '', notes: '', photo_url: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState(false);
  const [editPasswordOpen, setEditPasswordOpen] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [editPasswordError, setEditPasswordError] = useState(false);
  const [pendingEditClient, setPendingEditClient] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loansClient, setLoansClient] = useState(null);

  const queryClient = useQueryClient();
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 200),
  });

  const { data: clientLoans = [] } = useQuery({
    queryKey: ['client-loans', loansClient?.id],
    queryFn: () => base44.entities.Loan.filter({ client_id: loansClient.id }, '-created_date', 100),
    enabled: !!loansClient,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const client = await base44.entities.Client.create(data);
      // Crear carpeta en Drive
      base44.functions.invoke('createClientDriveFolder', {
        client_id: client.id,
        client_name: `${data.first_name} ${data.last_name}`,
      }).catch(() => {});
      return client;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); setDialogOpen(false); toast.success('Cliente creado'); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); setDialogOpen(false); toast.success('Cliente actualizado'); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); setDeleteOpen(false); setDeletePassword(''); setDeleteError(false); toast.success('Cliente eliminado'); },
  });

  const today = new Date().toISOString().split('T')[0];
  const fmt = (n) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n || 0);

  const STATUS_COLOR = {
    active: 'bg-emerald-500/10 text-emerald-400',
    paid: 'bg-blue-500/10 text-blue-400',
    overdue: 'bg-red-500/10 text-red-400',
    defaulted: 'bg-orange-500/10 text-orange-400',
  };
  const STATUS_TEXT = { active: 'Activo', paid: 'Pagado', overdue: 'Vencido', defaulted: 'Moroso' };

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return `${c.first_name} ${c.last_name} ${c.id_number} ${c.phone}`.toLowerCase().includes(q);
  });

  const openNew = () => { setEditingClient(null); setForm({ first_name: '', last_name: '', phone: '', address: '', id_number: '', notes: '', photo_url: '' }); setDialogOpen(true); };

  const openEdit = (c) => { setEditingClient(c); setForm({ first_name: c.first_name, last_name: c.last_name, phone: c.phone || '', address: c.address || '', id_number: c.id_number, notes: c.notes || '', photo_url: c.photo_url || '' }); setDialogOpen(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, photo_url: file_url }));
    setUploading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">{clients.length} clientes registrados</p>
        </div>
        <Button onClick={openNew} className="bg-[#d4a533] hover:bg-[#b8922d] text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Cliente
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input 
          placeholder="Buscar por nombre, cédula o teléfono..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-[#111827] border-[#1e293b] text-gray-200 placeholder:text-gray-600"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#d4a533]/30 border-t-[#d4a533] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-[#111827] rounded-xl border border-[#1e293b] p-5 hover:border-[#d4a533]/30 transition-colors group">
              <div className="flex items-start gap-3">
                {c.photo_url ? (
                  <img src={c.photo_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-[#1e293b]" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#d4a533]/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-[#d4a533]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-200 truncate">{c.first_name} {c.last_name}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                    <IdCard className="w-3 h-3" /> {c.id_number}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setLoansClient(c)} title="Ver préstamos" className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-blue-400">
                    <HandCoins className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setPendingEditClient(c); setEditPassword(''); setEditPasswordError(false); setEditPasswordOpen(true); }} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-[#d4a533]">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setDeletingClient(c); setDeletePassword(''); setDeleteError(false); setDeleteOpen(true); }} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                {c.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {c.phone}</div>}
                {c.address && <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {c.address}</div>}
              </div>
              {c.notes && <p className="mt-2 text-xs text-gray-600 line-clamp-2">{c.notes}</p>}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-600">
              {search ? 'No se encontraron clientes' : 'No hay clientes registrados'}
            </div>
          )}
        </div>
      )}

      {/* Loans Dialog */}
      <Dialog open={!!loansClient} onOpenChange={(open) => { if (!open) setLoansClient(null); }}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-gray-200 max-w-lg">
          <DialogHeader>
            <DialogTitle>Ficha del Cliente</DialogTitle>
          </DialogHeader>
          {loansClient && (
            <div className="space-y-4">
              {/* Client details */}
              <div className="flex items-start gap-4 bg-[#0a0e17] rounded-xl border border-[#1e293b] p-4">
                {loansClient.photo_url ? (
                  <img src={loansClient.photo_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-[#d4a533]/30 shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#d4a533]/10 flex items-center justify-center shrink-0">
                    <User className="w-7 h-7 text-[#d4a533]" />
                  </div>
                )}
                <div className="flex-1 space-y-1.5">
                  <h3 className="text-base font-bold text-gray-100">{loansClient.first_name} {loansClient.last_name}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5"><IdCard className="w-3 h-3 text-gray-600" /> {loansClient.id_number}</div>
                    {loansClient.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-gray-600" /> {loansClient.phone}</div>}
                    {loansClient.address && <div className="flex items-center gap-1.5 col-span-2"><MapPin className="w-3 h-3 text-gray-600" /> {loansClient.address}</div>}
                  </div>
                  {loansClient.notes && <p className="text-xs text-gray-500 italic mt-1">{loansClient.notes}</p>}
                </div>
              </div>

              {/* Summary counts */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-emerald-500/10 rounded-lg border border-emerald-500/20 p-2">
                  <p className="text-lg font-bold text-emerald-400">{clientLoans.filter(l => l.status === 'active' && !(l.due_date && l.due_date < today)).length}</p>
                  <p className="text-gray-500">Activos</p>
                </div>
                <div className="bg-red-500/10 rounded-lg border border-red-500/20 p-2">
                  <p className="text-lg font-bold text-red-400">{clientLoans.filter(l => (l.status === 'active' || l.status === 'overdue') && l.due_date && l.due_date < today).length}</p>
                  <p className="text-gray-500">Vencidos</p>
                </div>
                <div className="bg-orange-500/10 rounded-lg border border-orange-500/20 p-2">
                  <p className="text-lg font-bold text-orange-400">
                    {fmt(clientLoans.reduce((s, loan) => {
                      if (!loan.due_date || !loan.late_interest || !loan.remaining_balance || loan.status === 'paid') return s;
                      const days = Math.max(0, Math.floor((new Date(today) - new Date(loan.due_date)) / (1000 * 60 * 60 * 24)));
                      const grace = Math.max(0, days - (loan.grace_days || 0));
                      return s + grace * (loan.late_interest / 100) * loan.remaining_balance;
                    }, 0))}
                  </p>
                  <p className="text-gray-500">Mora</p>
                </div>
                <div className="bg-blue-500/10 rounded-lg border border-blue-500/20 p-2">
                  <p className="text-lg font-bold text-blue-400">{clientLoans.filter(l => l.status === 'paid').length}</p>
                  <p className="text-gray-500">Pagados</p>
                </div>
              </div>

              {/* Loans list */}
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Historial de Préstamos</p>
                {clientLoans.length === 0 ? (
                  <p className="text-center text-gray-600 py-6 text-sm">Sin préstamos registrados</p>
                ) : (
                  clientLoans.map(loan => {
                    let status = loan.status;
                    if (status === 'active' && loan.due_date && loan.due_date < today) status = 'overdue';
                    const mora = (() => {
                      if (!loan.due_date || !loan.late_interest || !loan.remaining_balance || loan.status === 'paid') return 0;
                      const daysOverdue = Math.max(0, Math.floor((new Date(today) - new Date(loan.due_date)) / (1000 * 60 * 60 * 24)));
                      const graceUsed = Math.max(0, daysOverdue - (loan.grace_days || 0));
                      return graceUsed * (loan.late_interest / 100) * loan.remaining_balance;
                    })();
                    return (
                      <div key={loan.id} className="bg-[#0a0e17] rounded-lg border border-[#1e293b] p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-200">{fmt(loan.amount)}</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setLoansClient(null); navigate(`/LoanDetail?id=${loan.id}`); }} className="flex items-center gap-1 text-xs text-[#d4a533] hover:underline">
                              <Eye className="w-3.5 h-3.5" /> Ver
                            </button>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[status] || 'bg-gray-500/10 text-gray-400'}`}>
                              {STATUS_TEXT[status] || status}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                          <span>Total a pagar: <span className="text-[#d4a533]">{fmt(loan.total_to_pay)}</span></span>
                          <span>Pagado: <span className="text-emerald-400">{fmt(loan.total_paid)}</span></span>
                          <span>Saldo: <span className="text-red-400">{fmt(loan.remaining_balance)}</span></span>
                          <span>Vence: <span className="text-gray-300">{loan.due_date || '—'}</span></span>
                          <span>Inicio: <span className="text-gray-300">{loan.start_date || '—'}</span></span>
                          <span>Cuotas: <span className="text-gray-300">{loan.num_installments}</span></span>
                          <span>Tasa: <span className="text-gray-300">{loan.interest_rate}%</span></span>
                          <span className={mora > 0 ? 'text-red-400 font-semibold' : ''}>Mora: <span>{mora > 0 ? fmt(mora) : '—'}</span></span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nombre *</label>
                <Input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} required className="bg-[#0a0e17] border-[#1e293b] text-gray-200" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Apellido *</label>
                <Input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} required className="bg-[#0a0e17] border-[#1e293b] text-gray-200" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Cédula / ID *</label>
              <Input value={form.id_number} onChange={e => setForm(p => ({ ...p, id_number: e.target.value }))} required className="bg-[#0a0e17] border-[#1e293b] text-gray-200" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Teléfono</label>
              <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="bg-[#0a0e17] border-[#1e293b] text-gray-200" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Dirección</label>
              <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="bg-[#0a0e17] border-[#1e293b] text-gray-200" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Foto</label>
              <div className="flex items-center gap-3">
                {form.photo_url && <img src={form.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />}
                <input type="file" accept="image/*" onChange={handleFileUpload} className="text-xs text-gray-400 file:mr-2 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:text-xs file:bg-white/5 file:text-gray-300" />
                {uploading && <div className="w-4 h-4 border-2 border-[#d4a533]/30 border-t-[#d4a533] rounded-full animate-spin" />}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Notas</label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="bg-[#0a0e17] border-[#1e293b] text-gray-200" rows={3} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-[#1e293b] text-gray-400 hover:bg-white/5">Cancelar</Button>
              <Button type="submit" className="bg-[#d4a533] hover:bg-[#b8922d] text-black font-semibold" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingClient ? 'Guardar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Password Dialog */}
      <AlertDialog open={editPasswordOpen} onOpenChange={(open) => { setEditPasswordOpen(open); if (!open) { setEditPassword(''); setEditPasswordError(false); } }}>
        <AlertDialogContent className="bg-[#111827] border-[#1e293b] text-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Verificar acceso</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Ingrese la contraseña para editar a <strong className="text-gray-300">{pendingEditClient?.first_name} {pendingEditClient?.last_name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <input
              type="password"
              value={editPassword}
              onChange={e => { setEditPassword(e.target.value); setEditPasswordError(false); }}
              placeholder="Contraseña"
              autoFocus
              className={`w-full px-3 py-2 rounded-lg bg-[#0a0e17] border text-gray-200 text-sm outline-none focus:ring-2 transition-all ${
                editPasswordError ? 'border-red-500 focus:ring-red-500/30' : 'border-[#1e293b] focus:ring-[#d4a533]/30'
              }`}
            />
            {editPasswordError && <p className="text-red-400 text-xs mt-1">Contraseña incorrecta</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1e293b] text-gray-400 hover:bg-white/5">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (editPassword !== '3030') { setEditPasswordError(true); return; }
                setEditPasswordOpen(false);
                openEdit(pendingEditClient);
              }}
              className="bg-[#d4a533] hover:bg-[#b8922d] text-black font-semibold"
            >Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) { setDeletePassword(''); setDeleteError(false); } }}>
        <AlertDialogContent className="bg-[#111827] border-[#1e293b] text-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Se eliminará permanentemente a {deletingClient?.first_name} {deletingClient?.last_name}. Ingrese la contraseña para confirmar.
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
                deleteMutation.mutate(deletingClient?.id);
              }}
              className="bg-red-600 hover:bg-red-700"
            >Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}