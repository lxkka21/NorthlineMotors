import type { Vehicle } from '../types/api';

interface VehicleCardProps {
  vehicle: Vehicle;
  isAdmin: boolean;
  busy: boolean;
  onPurchase: (vehicle: Vehicle) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
  onRestock: (vehicle: Vehicle) => void;
}

export function VehicleCard({ vehicle, isAdmin, busy, onPurchase, onEdit, onDelete, onRestock }: VehicleCardProps) {
  const soldOut = vehicle.quantityInStock === 0;
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex h-32 items-end justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 p-5 text-white">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">{vehicle.category}</p><h3 className="mt-1 text-2xl font-black">{vehicle.make} {vehicle.model}</h3></div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${soldOut ? 'bg-rose-400/20 text-rose-200' : 'bg-emerald-400/20 text-emerald-200'}`}>{soldOut ? 'Sold out' : `${vehicle.quantityInStock} in stock`}</span>
      </div>
      <div className="p-5">
        <p className="text-2xl font-black text-slate-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(vehicle.price)}</p>
        <button disabled={soldOut || busy} onClick={() => onPurchase(vehicle)} className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">{busy ? 'Updating…' : soldOut ? 'Unavailable' : 'Purchase vehicle'}</button>
        {isAdmin && <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4"><button onClick={() => onEdit(vehicle)} className="admin-action">Edit</button><button onClick={() => onRestock(vehicle)} className="admin-action">Restock</button><button onClick={() => onDelete(vehicle)} className="admin-action text-rose-600">Delete</button></div>}
      </div>
    </article>
  );
}

