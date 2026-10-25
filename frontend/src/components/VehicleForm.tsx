import { useEffect, useState, type FormEvent } from 'react';
import type { Vehicle, VehicleInput } from '../types/api';

interface VehicleFormProps {
  vehicle?: Vehicle | null;
  onSubmit: (input: VehicleInput) => Promise<void>;
  onCancel: () => void;
}

const blank: VehicleInput = { make: '', model: '', category: '', price: 0, quantityInStock: 0 };

export function VehicleForm({ vehicle, onSubmit, onCancel }: VehicleFormProps) {
  const [form, setForm] = useState<VehicleInput>(vehicle ? { make: vehicle.make, model: vehicle.model, category: vehicle.category, price: vehicle.price, quantityInStock: vehicle.quantityInStock } : blank);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm(vehicle ? { make: vehicle.make, model: vehicle.model, category: vehicle.category, price: vehicle.price, quantityInStock: vehicle.quantityInStock } : blank); }, [vehicle]);
  const field = (key: keyof VehicleInput, value: string | number) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (!form.make.trim() || !form.model.trim() || !form.category.trim() || form.price < 0 || form.quantityInStock < 0) return setError('Complete every field with valid non-negative values.');
    setSaving(true); try { await onSubmit({ ...form, make: form.make.trim(), model: form.model.trim(), category: form.category.trim() }); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to save vehicle.'); } finally { setSaving(false); }
  }
  return <form onSubmit={submit} className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5"><div className="mb-4 flex items-center justify-between"><h3 className="font-black text-slate-900">{vehicle ? 'Edit vehicle' : 'Add vehicle'}</h3><button type="button" onClick={onCancel} className="text-sm font-bold text-slate-500">Cancel</button></div><div className="grid gap-3 sm:grid-cols-2"><input aria-label="Vehicle make" className="field" placeholder="Make" value={form.make} onChange={(event) => field('make', event.target.value)} /><input aria-label="Vehicle model" className="field" placeholder="Model" value={form.model} onChange={(event) => field('model', event.target.value)} /><input aria-label="Vehicle category" className="field" placeholder="Category" value={form.category} onChange={(event) => field('category', event.target.value)} /><input aria-label="Vehicle price" className="field" type="number" min="0" value={form.price} onChange={(event) => field('price', Number(event.target.value))} /><input aria-label="Vehicle stock" className="field" type="number" min="0" step="1" value={form.quantityInStock} onChange={(event) => field('quantityInStock', Number(event.target.value))} /></div>{error && <p role="alert" className="mt-3 text-sm font-semibold text-rose-700">{error}</p>}<button disabled={saving} className="mt-4 rounded-xl bg-cyan-700 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{saving ? 'Saving…' : vehicle ? 'Save changes' : 'Add to inventory'}</button></form>;
}

