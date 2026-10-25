import { useEffect, useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginPage } from './components/AdminLoginPage';
import { CartDrawer } from './components/CartDrawer';
import { OrderHistory } from './components/OrderHistory';
import { SiteFooter } from './components/SiteFooter';
import { VehicleCard } from './components/VehicleCard';
import { VehicleDetailPage } from './components/VehicleDetailPage';
import { VehicleFilters } from './components/VehicleFilters';
import { VehicleForm } from './components/VehicleForm';
import { api } from './lib/api';
import { useLocation, useNavigate } from 'react-router-dom';
import type { CartLine, Order, RegistrationInput, SessionResponse, User, Vehicle, VehicleFilters as Filters, VehicleInput } from './types/api';

const TOKEN_KEY = 'northline.session';

function readSession(): SessionResponse | null {
  try { return JSON.parse(localStorage.getItem(TOKEN_KEY) ?? 'null') as SessionResponse | null; } catch { return null; }
}

function friendlyError(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

async function loadInventory(
  token: string,
  filters: Filters,
  setVehicles: (vehicles: Vehicle[]) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string) => void,
  isActive: () => boolean,
) {
  setLoading(true);
  setError('');
  try {
    const result = await api.listVehicles(token, filters);
    if (isActive()) setVehicles(result.vehicles);
  } catch (caught) {
    if (isActive()) setError(friendlyError(caught));
  } finally {
    if (isActive()) setLoading(false);
  }
}

export default function App() {
  const [session, setSession] = useState<SessionResponse | null>(() => readSession());
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [catalogVehicles, setCatalogVehicles] = useState<Vehicle[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [restockTarget, setRestockTarget] = useState<Vehicle | null>(null);
  const [restockQuantity, setRestockQuantity] = useState('1');
  const [managedUsers, setManagedUsers] = useState<User[]>([]);
  const [roleBusyId, setRoleBusyId] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const sessionToken = session?.token;
  const sessionUserId = session?.user.id;

  function saveSession(next: SessionResponse | null) {
    setSession(next);
    if (next) localStorage.setItem(TOKEN_KEY, JSON.stringify(next));
    else localStorage.removeItem(TOKEN_KEY);
  }

  // Local storage is only a session cache. Reconcile the role with the server
  // before presenting role-sensitive controls so a revoked role cannot remain
  // visible in the UI until the next login.
  useEffect(() => {
    const token = session?.token;
    if (!token) return;
    let active = true;
    void api.me(token)
      .then(({ user }) => {
        if (!active) return;
        setSession((current) => current?.token === token ? { token, user } : current);
        localStorage.setItem(TOKEN_KEY, JSON.stringify({ token, user } satisfies SessionResponse));
      })
      .catch(() => {
        if (active) saveSession(null);
      });
    return () => { active = false; };
  }, [session?.token]);

  useEffect(() => {
    if (!sessionToken) return;
    let active = true;
    void loadInventory(sessionToken, filters, setVehicles, setLoading, setError, () => active);
    return () => { active = false; };
  }, [sessionToken, filters]);

  useEffect(() => {
    if (!sessionToken) return;
    let active = true;
    void api.listVehicles(sessionToken).then((result) => { if (active) setCatalogVehicles(result.vehicles); }).catch((caught) => { if (active) setError(friendlyError(caught)); });
    return () => { active = false; };
  }, [sessionToken]);

  useEffect(() => {
    queueMicrotask(() => {
      if (!sessionUserId) { setCart([]); return; }
      try { setCart(JSON.parse(localStorage.getItem(`northline.cart.${sessionUserId}`) ?? '[]') as CartLine[]); } catch { setCart([]); }
    });
  }, [sessionUserId]);

  useEffect(() => {
    if (sessionUserId) localStorage.setItem(`northline.cart.${sessionUserId}`, JSON.stringify(cart));
  }, [cart, sessionUserId]);

  useEffect(() => {
    if (!session || session.user.role !== 'admin') return;
    void api.listUsers(session.token).then((result) => setManagedUsers(result.users ?? [])).catch((caught) => setError(friendlyError(caught)));
  }, [session]);

  useEffect(() => {
    if (session && location.pathname === '/admin/login') navigate(session.user.role === 'admin' ? '/admin/dashboard' : '/');
  }, [location.pathname, navigate, session]);

  async function authenticate(mode: 'login' | 'register', input: { email: string; password: string } | RegistrationInput) {
    return mode === 'login' ? api.login(input.email, input.password) : api.register(input as RegistrationInput);
  }

  async function refresh(message = '') {
    if (!session) return;
    const [result, catalog] = await Promise.all([api.listVehicles(session.token, filters), api.listVehicles(session.token)]);
    setVehicles(result.vehicles); setCatalogVehicles(catalog.vehicles); setNotice(message); setError('');
    window.setTimeout(() => setNotice(''), 3500);
  }

  function addToCart(vehicle: Vehicle) {
    if (vehicle.quantityInStock <= 0) { setError('This vehicle is currently unavailable.'); return; }
    const current = cart.find((line) => line.vehicle.id === vehicle.id);
    if (current && current.quantity >= vehicle.quantityInStock) { setError(`Only ${vehicle.quantityInStock} available for this vehicle.`); return; }
    setCart((lines) => current ? lines.map((line) => line.vehicle.id === vehicle.id ? { ...line, vehicle, quantity: line.quantity + 1 } : line) : [...lines, { vehicle, quantity: 1 }]);
    setNotice(`${vehicle.make} ${vehicle.model} added to your cart.`);
    setCartOpen(true);
    window.setTimeout(() => setNotice(''), 3000);
  }

  function changeCartQuantity(vehicleId: string, quantity: number) {
    setCart((lines) => lines.map((line) => line.vehicle.id === vehicleId ? { ...line, quantity: Math.min(Math.max(1, quantity), line.vehicle.quantityInStock) } : line));
  }

  function removeFromCart(vehicleId: string) {
    setCart((lines) => lines.filter((line) => line.vehicle.id !== vehicleId));
    setNotice('Vehicle removed from your cart.');
  }

  async function checkout(details: { customerName: string; contact: string; fulfillment: 'pickup' | 'delivery'; idempotencyKey: string }) {
    if (!session) return;
    const result = await api.createOrder(session.token, { ...details, items: cart.map((line) => ({ vehicleId: line.vehicle.id, quantity: line.quantity })) });
    try { setVehicles((await api.listVehicles(session.token, filters)).vehicles); } catch { /* the order is already persisted; the next refresh will reconcile inventory */ }
    setConfirmedOrder(result.order);
    setCart([]);
    setNotice('Purchase completed successfully.');
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

  async function assignRole(user: User, role: User['role']) {
    if (!session || user.id === session.user.id) return;
    setRoleBusyId(user.id); setError('');
    try {
      const result = await api.assignRole(session.token, user.id, role);
      setManagedUsers((current) => current.map((item) => item.id === result.user.id ? result.user : item));
      setNotice(`${result.user.email} is now ${result.user.role}.`);
    } catch (caught) { setError(friendlyError(caught)); }
    finally { setRoleBusyId(''); }
  }

  if (!session) return location.pathname === '/admin/login' ? <AdminLoginPage onAuthenticated={saveSession} login={api.login} /> : <AuthScreen onAuthenticated={saveSession} request={authenticate} />;

  const user: User = session.user;
  const isAdmin = user.role === 'admin';
  const detailRoute = location.pathname.startsWith('/vehicles/');
  const adminRoute = location.pathname.startsWith('/admin/');
  return (
    <div className="min-h-screen bg-[#f2f0eb] text-[#111417]">
      <header className="border-b border-[#292d30] bg-[#0b0e10] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3"><span className="wordmark-mark">N</span><div><p className="text-xs font-black uppercase tracking-[0.25em] text-[#e66a2c]">Northline Motors</p><h1 className="mt-1 font-serif text-xl font-normal tracking-tight sm:text-2xl">Inventory command center</h1></div></div>
          <div className="flex items-center gap-2">{isAdmin && <button className="nav-action" onClick={() => navigate('/admin/dashboard')}>Admin portal</button>}<button className="nav-action" onClick={() => { setOrdersOpen(true); setCartOpen(false); }}>Orders</button><button className="nav-action cart-action" onClick={() => { setCartOpen(true); setOrdersOpen(false); }} aria-label={`Open cart with ${cart.reduce((sum, line) => sum + line.quantity, 0)} items`}><span aria-hidden="true">▱</span> Cart <b>{cart.reduce((sum, line) => sum + line.quantity, 0)}</b></button><div className="hidden text-right sm:block"><p className="text-sm font-bold">{user.email}</p><p className="text-xs uppercase tracking-widest text-slate-400">{user.role === 'admin' ? 'Administrator' : 'Customer'}</p></div><button onClick={() => saveSession(null)} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">Sign out</button></div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        {adminRoute ? (isAdmin ? <AdminDashboard session={session} vehicles={catalogVehicles} managedUsers={managedUsers} showForm={showForm} editing={editing} restockTarget={restockTarget} restockQuantity={restockQuantity} busyId={busyId} roleBusyId={roleBusyId} onSubmit={submitVehicle} onCancel={() => { setShowForm(false); setEditing(null); }} onAdd={() => { setEditing(null); setShowForm(true); }} onEdit={(item) => { setEditing(item); setShowForm(true); }} onDelete={deleteVehicle} onRestock={(item) => { setRestockTarget(item); setRestockQuantity('1'); }} onRestockQuantity={setRestockQuantity} onConfirmRestock={() => void restock()} onCancelRestock={() => setRestockTarget(null)} onAssignRole={assignRole} onLogout={() => saveSession(null)} /> : <section className="detail-state" role="alert"><h2>Access denied</h2><p>Administrator access is required for this workspace.</p><button className="primary-button" onClick={() => navigate('/')}>Return to customer site</button></section>) : detailRoute ? <VehicleDetailPage token={session.token} catalog={catalogVehicles} onAddToCart={addToCart} onOpenCart={() => { setCartOpen(true); setOrdersOpen(false); }} /> : <>
        <div className="mb-10 flex flex-col justify-between gap-5 border-b border-[#d7d3cb] pb-8 md:flex-row md:items-end"><div><p className="eyebrow accent">Live inventory / Northline collection</p><h2 className="mt-3 max-w-3xl font-serif text-5xl font-normal leading-[.95] tracking-[-.06em] text-[#111417] sm:text-7xl">Find your next<br /><span className="text-[#e66a2c]">line of motion.</span></h2><p className="mt-5 max-w-xl text-[#706c64]">A considered collection of vehicles, available now. Search by the details that matter.</p></div><div className="flex items-center gap-4">{isAdmin && <button onClick={() => { setEditing(null); setShowForm(true); }} className="border border-[#111417] bg-[#111417] px-5 py-3 text-sm font-black text-white transition hover:border-[#e66a2c] hover:bg-[#e66a2c]">+ Add vehicle</button>}</div></div>
        {notice && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{notice}</p>}
        {error && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{error}</p>}
        {showForm && isAdmin && <div className="mb-6"><VehicleForm key={editing?.id ?? 'new'} vehicle={editing} onSubmit={submitVehicle} onCancel={() => { setShowForm(false); setEditing(null); }} /></div>}
         {isAdmin && <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-4"><h3 className="text-lg font-black">User access</h3><p className="text-sm text-slate-500">Assign user or administrator access. Your own role cannot be changed here.</p></div><div className="space-y-3">{managedUsers.map((managedUser) => <div key={managedUser.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3"><div><p className="font-bold">{managedUser.email}</p><p className="text-xs uppercase tracking-wider text-slate-500">Current role: {managedUser.role}</p></div><select aria-label={`Role for ${managedUser.email}`} value={managedUser.role} disabled={managedUser.id === session.user.id || roleBusyId === managedUser.id} onChange={(event) => void assignRole(managedUser, event.target.value as User['role'])} className="field w-36"><option value="user">User</option><option value="admin">Admin</option></select></div>)}</div></section>}
        {restockTarget && isAdmin && <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5"><div><p className="text-sm font-black text-amber-900">Restock {restockTarget.make} {restockTarget.model}</p><label className="mt-2 block text-xs font-bold uppercase tracking-wider text-amber-800">Units<input aria-label="Restock quantity" type="number" min="1" step="1" value={restockQuantity} onChange={(event) => setRestockQuantity(event.target.value)} className="field mt-1 w-32 bg-white" /></label></div><button onClick={restock} disabled={busyId === restockTarget.id} className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950">Confirm restock</button><button onClick={() => setRestockTarget(null)} className="rounded-xl px-3 py-3 text-sm font-bold text-amber-900">Cancel</button></div>}
        <VehicleFilters filters={filters} vehicles={catalogVehicles} onApply={setFilters} onClear={() => setFilters({})} />
        <div className="mb-5 mt-8 flex items-center justify-between"><p className="text-sm font-bold text-slate-500">{loading ? 'Refreshing inventory…' : `${vehicles.length} vehicle${vehicles.length === 1 ? '' : 's'} available`}</p>{loading && <span aria-label="Loading" className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />}</div>
        {!loading && !error && vehicles.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><p className="text-5xl">⌕</p><h3 className="mt-4 text-xl font-black">No vehicles found</h3><p className="mt-2 text-slate-500">Try broadening your filters or add a new vehicle to the lot.</p></div>}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{vehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} isAdmin={isAdmin} busy={busyId === vehicle.id} onAddToCart={addToCart} onEdit={(item) => { setEditing(item); setShowForm(true); }} onDelete={deleteVehicle} onRestock={(item) => { setRestockTarget(item); setRestockQuantity('1'); }} />)}</div>
        </>}
      </main>
      <SiteFooter onOpenCart={() => { navigate('/'); setCartOpen(true); setOrdersOpen(false); }} onOpenOrders={() => { navigate('/'); setOrdersOpen(true); setCartOpen(false); }} />
      <CartDrawer open={cartOpen} lines={cart} confirmedOrder={confirmedOrder} onClose={() => setCartOpen(false)} onQuantity={changeCartQuantity} onRemove={removeFromCart} onCheckout={checkout} onDismissConfirmation={() => setConfirmedOrder(null)} />
      <OrderHistory open={ordersOpen} token={session.token} onClose={() => setOrdersOpen(false)} load={api.listOrders} />
    </div>
  );
}
