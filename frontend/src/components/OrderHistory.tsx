import { useEffect, useState } from 'react';
import type { Order } from '../types/api';

interface OrderHistoryProps { token: string; open: boolean; onClose: () => void; load: (token: string) => Promise<{ orders: Order[] }>; }
function money(value: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value); }
function date(value: string) { return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value)); }

export function OrderHistory({ token, open, onClose, load }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState('');
  useEffect(() => {
    if (!open) return;
    let active = true;
    queueMicrotask(() => { if (active) { setLoading(true); setError(''); } });
    void load(token).then((result) => { if (active) setOrders(result.orders); }).catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Unable to load order history.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load, open, token]);
  if (!open) return null;
  return <div className="drawer-backdrop" role="presentation" onClick={onClose}><aside className="orders-drawer" role="dialog" aria-modal="true" aria-label="Order history" onClick={(event) => event.stopPropagation()}><div className="drawer-header"><div><p className="eyebrow accent">Your Northline record</p><h2>Order history.</h2></div><button className="icon-button" aria-label="Close order history" onClick={onClose}>×</button></div>{loading && <p className="drawer-loading">Loading your orders...</p>}{error && <p role="alert" className="form-error">{error}</p>}{!loading && !error && orders.length === 0 && <div className="cart-empty"><p className="eyebrow accent">No requests yet</p><h3>Your history starts here.</h3><p>Completed purchase requests will stay available across sessions.</p></div>}<div className="order-list">{orders.map((order) => <article className="order-row" key={order.id}><button className="order-row-toggle" onClick={() => setExpanded(expanded === order.id ? '' : order.id)}><span><strong>{order.orderNumber}</strong><small>{date(order.createdAt)} · {order.items.length} vehicle{order.items.length === 1 ? '' : 's'}</small></span><span className="order-row-right"><b>{money(order.total)}</b><em>{order.status}</em></span></button>{expanded === order.id && <div className="order-details">{order.items.map((item) => <div key={item.id}><span>{item.make} {item.model} × {item.quantity}</span><strong>{money(item.unitPrice * item.quantity)}</strong></div>)}<p>{order.fulfillment === 'pickup' ? 'Pickup at Northline' : 'Delivery discussion'} · {order.contact}</p></div>}</article>)}</div></aside></div>;
}
