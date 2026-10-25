import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { VehicleCard } from './VehicleCard';
import { VehicleForm } from './VehicleForm';
import type { SessionResponse, User, Vehicle, VehicleInput } from '../types/api';

interface AdminDashboardProps {
  session: SessionResponse; vehicles: Vehicle[]; managedUsers: User[]; showForm: boolean; editing: Vehicle | null; restockTarget: Vehicle | null; restockQuantity: string; busyId: string; roleBusyId: string;
  onSubmit: (input: VehicleInput) => Promise<void>; onCancel: () => void; onAdd: () => void; onEdit: (vehicle: Vehicle) => void; onDelete: (vehicle: Vehicle) => void; onRestock: (vehicle: Vehicle) => void; onRestockQuantity: (value: string) => void; onConfirmRestock: () => void; onCancelRestock: () => void; onAssignRole: (user: User, role: User['role']) => void; onLogout: () => void;
}

function Metric({ label, value }: { label: string; value: ReactNode }) { return <div className="admin-metric"><span>{label}</span><strong>{value}</strong></div>; }

export function AdminDashboard({ session, vehicles, managedUsers, showForm, editing, restockTarget, restockQuantity, busyId, roleBusyId, onSubmit, onCancel, onAdd, onEdit, onDelete, onRestock, onRestockQuantity, onConfirmRestock, onCancelRestock, onAssignRole, onLogout }: AdminDashboardProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const restockRef = useRef<HTMLDivElement>(null);
  const totalStock = vehicles.reduce((sum, vehicle) => sum + vehicle.quantityInStock, 0);
  const outOfStock = vehicles.filter((vehicle) => vehicle.quantityInStock === 0).length;
  const categories = new Set(vehicles.map((vehicle) => vehicle.category)).size;

  useEffect(() => { if (showForm) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [editing, showForm]);
  useEffect(() => { if (restockTarget) restockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [restockTarget]);

  return <div className="admin-dashboard"><div className="admin-dashboard-head"><div><p className="eyebrow accent">Northline Motors / control room</p><h2>Admin dashboard.</h2><p>Manage the live vehicle collection and user access.</p></div><div className="admin-dashboard-actions"><Link to="/" className="admin-quiet-link">Customer site</Link><button onClick={onLogout} className="admin-logout">Log out</button></div></div><nav className="admin-nav" aria-label="Admin navigation"><a href="#overview">Overview</a><a href="#inventory">Vehicle inventory</a><a href="#users">User management</a></nav><section id="overview" className="admin-metrics"><Metric label="Listings" value={vehicles.length} /><Metric label="Units in stock" value={totalStock} /><Metric label="Out of stock" value={outOfStock} /><Metric label="Categories" value={categories} /></section><section id="inventory" className="admin-section"><div className="admin-section-heading"><div><p className="eyebrow">Live inventory</p><h3>Vehicle inventory</h3></div><button onClick={onAdd} className="primary-button">+ Add vehicle</button></div>{showForm && <div ref={formRef} className="admin-action-panel"><VehicleForm vehicle={editing} onSubmit={onSubmit} onCancel={onCancel} /></div>}{restockTarget && <div ref={restockRef} className="restock-panel"><div><p className="eyebrow accent">Stock adjustment</p><strong>Restock {restockTarget.make} {restockTarget.model}</strong><label>Units<input aria-label="Restock quantity" type="number" min="1" step="1" value={restockQuantity} onChange={(event) => onRestockQuantity(event.target.value)} /></label></div><button className="primary-button" onClick={onConfirmRestock} disabled={busyId === restockTarget.id}>Confirm restock</button><button className="text-button" onClick={onCancelRestock}>Cancel</button></div>}<div className="admin-vehicle-grid">{vehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} isAdmin busy={busyId === vehicle.id} onAddToCart={() => undefined} onEdit={onEdit} onDelete={onDelete} onRestock={onRestock} />)}</div></section><section id="users" className="admin-section"><div className="admin-section-heading"><div><p className="eyebrow">Access control</p><h3>User management</h3></div></div><div className="admin-user-list">{managedUsers.map((user) => <div className="admin-user-row" key={user.id}><div><strong>{user.fullName ?? user.email}</strong><small>{user.email} · current role: {user.role}</small></div><select aria-label={`Role for ${user.email}`} disabled={user.id === session.user.id || roleBusyId === user.id} value={user.role} onChange={(event) => onAssignRole(user, event.target.value as User['role'])}><option value="user">User</option><option value="admin">Admin</option></select></div>)}</div></section></div>;
}
