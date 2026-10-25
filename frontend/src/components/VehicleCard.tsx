import { Link } from 'react-router-dom';
import type { Vehicle } from '../types/api';
import { fallbackImage, imageForVehicle } from '../lib/vehicle-media';

interface VehicleCardProps {
  vehicle: Vehicle;
  isAdmin: boolean;
  busy: boolean;
  onAddToCart: (vehicle: Vehicle) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
  onRestock: (vehicle: Vehicle) => void;
}

export function VehicleCard({ vehicle, isAdmin, busy, onAddToCart, onEdit, onDelete, onRestock }: VehicleCardProps) {
  const soldOut = vehicle.quantityInStock === 0;
  return (
    <article className="vehicle-card">
      <Link to={`/vehicles/${vehicle.id}`} className="vehicle-detail-link" aria-label={`View details for ${vehicle.make} ${vehicle.model}`}>
        <div className="vehicle-image-wrap"><img src={imageForVehicle(vehicle)} onError={fallbackImage} alt={`${vehicle.make} ${vehicle.model}`} loading="lazy" /><div className="vehicle-image-shade" /><div className="vehicle-card-top"><span className="vehicle-category">{vehicle.category}</span><span className={`stock-label ${soldOut ? 'sold-out' : ''}`}>{soldOut ? 'Sold out' : `${vehicle.quantityInStock} in stock`}</span></div></div>
        <div className="vehicle-card-body"><p className="vehicle-make">{vehicle.make} · {vehicle.year ?? 'Year not recorded'}</p><h3>{vehicle.make} {vehicle.model}</h3></div>
      </Link>
      <div className="vehicle-card-body vehicle-card-actions"><div className="vehicle-card-footer"><p className="vehicle-price">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(vehicle.price)}</p><button disabled={soldOut || busy} onClick={() => onAddToCart(vehicle)} className="purchase-button">{busy ? 'Adding...' : soldOut ? 'Unavailable' : 'Add to cart'}</button></div>
        {isAdmin && <div className="admin-actions"><button onClick={() => onEdit(vehicle)}>Edit</button><button onClick={() => onRestock(vehicle)}>Restock</button><button onClick={() => onDelete(vehicle)} className="danger">Delete</button></div>}
      </div>
    </article>
  );
}
