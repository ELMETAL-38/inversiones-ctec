import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, User, Phone, MapPin, IdCard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function Clients() {
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

  const queryClient = useQueryClient();
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
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