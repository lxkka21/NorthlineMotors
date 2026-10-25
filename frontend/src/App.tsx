import { useEffect, useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { VehicleCard } from './components/VehicleCard';
import { VehicleFilters } from './components/VehicleFilters';
import { VehicleForm } from './components/VehicleForm';
import { api, type ApiError } from './lib/api';
import type { SessionResponse, User, Vehicle, VehicleFilters as Filters, VehicleInput } from './types/api';

const TOKEN_KEY = 'northline.session';

function readSession(): SessionResponse | null {
  try { return JSON.parse(localStorage.getItem(TOKEN_KEY) ?? 'null') as SessionResponse | null; } catch { return null; }
}

function friendlyError(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export default function App() {
  const [session, setSession] = useState<SessionResponse | null>(() => readSession());
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [restockTarget, setRestockTarget] = useState<Vehicle | null>(null);
  const [restockQuantity, setRestockQuantity] = useState('1');

  function saveSession(next: SessionResponse | null) {
    setSession(next);
    if (next) localStorage.setItem(TOKEN_KEY, JSON.stringify(next));
    else localStorage.removeItem(TOKEN_KEY);
  }

  useEffect(() => {
    if (!session) return;
    let active = true;
    setLoading(true); setError('');
    api.listVehicles(session.token, filters).then((result) => {
      if (active) setVehicles(result.vehicles);
    }).catch((caught) => {
      if (active) setError(friendlyError(caught));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session, filters]);

  async function authenticate(mode: 'login' | 'register', email: string, password: string) {
    return mode === 'login' ? api.login(email, password) : api.register(email, password);
  }

  async function refresh(message = '') {
    if (!session) return;
    const result = await api.listVehicles(session.token, filters);
    setVehicles(result.vehicles); setNotice(message); setError('');
    window.setTimeout(() => setNotice(''), 3500);
  }

  async function purchase(vehicle: Vehicle) {
    if (!session) return;
    setBusyId(vehicle.id); setError('');
    try { await api.purchase(session.token, vehicle.id); await refresh(`${vehicle.make} ${vehicle.model} marked as purchased.`); }
    catch (caught) { setError(friendlyError(caught)); }
    finally { setBusyId(''); }
  }

  async function submitVehicle(input: VehicleInput) {
    if (!session) return;
    if (editing) await api.updateVehicle(session.token, editing.id, input);
    else await api.createVehicle(session.token, input);
    setShowForm(false); setEditing(null); await refresh(editing ? 'Vehicle details updated.' : 'Vehicle added to inventory.');
  }

  async function deleteVehicle(vehicle: Vehicle) {
    if (!session || !window.confirm(`Delete ${vehicle.make} ${vehicle.model}?`)) return;
    setBusyId(vehicle.id); setError('');
    try { await api.deleteVehicle(session.token, vehicle.id); await refresh('Vehicle deleted.'); }
    catch (caught) { setError(friendlyError(caught)); }
    finally { setBusyId(''); }
  }

  async function restock() {
    if (!session || !restockTarget) return;
    const quantity = Number(restockQuantity);
    if (!Number.isInteger(quantity) || quantity <= 0) { setError('Restock quantity must be a positive whole number.'); return; }
    setBusyId(restockTarget.id); setError('');
    try { await api.restock(session.token, restockTarget.id, quantity); setRestockTarget(null); await refresh('Inventory restocked.'); }
    catch (caught) { setError(friendlyError(caught)); }
    finally { setBusyId(''); }
  }

  if (!session) return <AuthScreen onAuthenticated={saveSession} request={authenticate} />;

  const user: User = session.user;
  const isAdmin = user.role === 'admin';
  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-900">
      <header className="border-b border-slate-200 bg-[#08111f] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <div><p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Northline Motors</p><h1 className="mt-1 text-xl font-black sm:text-2xl">Inventory command center</h1></div>
          <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-bold">{user.email}</p><p className="text-xs uppercase tracking-widest text-slate-400">{isAdmin ? 'Administrator' : 'Sales team'}</p></div><button onClick={() => saveSession(null)} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">Sign out</button></div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">Live inventory</p><h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Find the right vehicle.</h2><p className="mt-2 text-slate-500">Search the lot, update availability and keep every conversation moving.</p></div>{isAdmin && <button onClick={() => { setEditing(null); setShowForm(true); }} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white hover:bg-cyan-700">+ Add vehicle</button>}</div>
        {notice && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{notice}</p>}
        {error && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{error}</p>}
        {showForm && isAdmin && <div className="mb-6"><VehicleForm vehicle={editing} onSubmit={submitVehicle} onCancel={() => { setShowForm(false); setEditing(null); }} /></div>}
        {restockTarget && isAdmin && <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5"><div><p className="text-sm font-black text-amber-900">Restock {restockTarget.make} {restockTarget.model}</p><label className="mt-2 block text-xs font-bold uppercase tracking-wider text-amber-800">Units<input aria-label="Restock quantity" type="number" min="1" step="1" value={restockQuantity} onChange={(event) => setRestockQuantity(event.target.value)} className="field mt-1 w-32 bg-white" /></label></div><button onClick={restock} disabled={busyId === restockTarget.id} className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950">Confirm restock</button><button onClick={() => setRestockTarget(null)} className="rounded-xl px-3 py-3 text-sm font-bold text-amber-900">Cancel</button></div>}
        <VehicleFilters filters={filters} onChange={setFilters} onClear={() => setFilters({})} />
        <div className="mb-5 mt-8 flex items-center justify-between"><p className="text-sm font-bold text-slate-500">{loading ? 'Refreshing inventory…' : `${vehicles.length} vehicle${vehicles.length === 1 ? '' : 's'} available`}</p>{loading && <span aria-label="Loading" className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />}</div>
        {!loading && vehicles.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><p className="text-5xl">⌕</p><h3 className="mt-4 text-xl font-black">No vehicles found</h3><p className="mt-2 text-slate-500">Try broadening your filters or add a new vehicle to the lot.</p></div>}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{vehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} isAdmin={isAdmin} busy={busyId === vehicle.id} onPurchase={purchase} onEdit={(item) => { setEditing(item); setShowForm(true); }} onDelete={deleteVehicle} onRestock={(item) => { setRestockTarget(item); setRestockQuantity('1'); }} />)}</div>
      </main>
    </div>
  );
}

