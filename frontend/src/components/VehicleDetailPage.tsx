import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { VehicleCard } from './VehicleCard';
import { api } from '../lib/api';
import { fallbackImage, imageForVehicle } from '../lib/vehicle-media';
import type { Vehicle } from '../types/api';

interface VehicleDetailPageProps {
  token: string;
  catalog: Vehicle[];
  onAddToCart: (vehicle: Vehicle) => void;
  onOpenCart: () => void;
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function VehicleDetailPage({ token, catalog, onAddToCart, onOpenCart }: VehicleDetailPageProps) {
  const location = useLocation();
  const id = decodeURIComponent(location.pathname.split('/').filter(Boolean)[1] ?? '');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadedId, setLoadedId] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    let active = true;
    void api.getVehicle(token, id).then(({ vehicle: found }) => { if (active) { setVehicle(found); setError(''); setLoadedId(id); } }).catch((caught) => { if (active) { setVehicle(null); setError(caught instanceof Error ? caught.message : 'Vehicle details could not be loaded.'); setLoadedId(id); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, token]);

  const related = useMemo(() => catalog.filter((item) => item.id !== vehicle?.id).slice(0, 3), [catalog, vehicle?.id]);

  if (loading || loadedId !== id) return <section className="detail-state" aria-live="polite"><span className="detail-loader" />Loading vehicle details…</section>;
  if (error) return <section className="detail-state detail-error" role="alert"><p>{error}</p><Link className="text-link" to="/">Back to inventory</Link></section>;
  if (!vehicle) return <section className="detail-state"><h2>Vehicle unavailable</h2><p>This vehicle may have been sold or removed from the inventory.</p><Link className="text-link" to="/">Back to inventory</Link></section>;

  const soldOut = vehicle.quantityInStock === 0;
  const gallery = [vehicle.imageUrl, ...(vehicle.imageUrls ?? [])].filter((item): item is string => Boolean(item));
  const images = gallery.length > 0 ? gallery : [imageForVehicle(vehicle)];
  const image = images[selectedImage] ?? images[0];
  return (
    <div className="vehicle-detail-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span>→</span><Link to="/">Inventory</Link><span>→</span><strong>{vehicle.make} {vehicle.model}</strong></nav>
      <Link to="/" className="back-link">← Back to inventory</Link>
      <div className="detail-grid">
        <div className="detail-gallery">
          <div className="detail-main-image"><img src={image} onError={fallbackImage} alt={`${vehicle.make} ${vehicle.model}`} /></div>
          <div className="detail-thumbnails">{images.map((item, index) => <button type="button" key={item} className={index === selectedImage ? 'active' : ''} aria-label={`View photo ${index + 1}`} onClick={() => setSelectedImage(index)}><img src={item} onError={fallbackImage} alt="" /></button>)}</div><div className="gallery-caption"><span>Vehicle photography</span><span>{images.length} photo{images.length === 1 ? '' : 's'} available</span></div>
        </div>
        <section className="detail-copy">
          <p className="eyebrow accent">Northline collection / {vehicle.category}</p>
          <p className="detail-make">{vehicle.make}{vehicle.year ? ` · ${vehicle.year}` : ''}</p>
          <h1>{vehicle.model}</h1>
          <p className="detail-price">{money.format(vehicle.price)}</p>
          <p className={`detail-stock ${soldOut ? 'sold-out' : ''}`}>{soldOut ? 'Currently unavailable' : `${vehicle.quantityInStock} available now`}</p>
          <div className="detail-actions"><button className="purchase-button detail-purchase" disabled={soldOut} onClick={() => { onAddToCart(vehicle); onOpenCart(); }}>{soldOut ? 'Unavailable' : 'Add to cart'}</button><a className="contact-button" href="mailto:suryalakavalli@gmail.com">Contact dealership</a></div>
          {soldOut && <p className="detail-note">This vehicle cannot be purchased while stock is zero.</p>}
          <div className="detail-specs"><h2>Vehicle details</h2><dl><div><dt>Category</dt><dd>{vehicle.category}</dd></div><div><dt>Price</dt><dd>{money.format(vehicle.price)}</dd></div><div><dt>Stock</dt><dd>{soldOut ? 'Sold out' : vehicle.quantityInStock}</dd></div><div><dt>Model year</dt><dd>{vehicle.year ?? 'Not provided'}</dd></div>{vehicle.mileage !== undefined && <div><dt>Mileage</dt><dd>{vehicle.mileage.toLocaleString()} km</dd></div>}{vehicle.fuelType && <div><dt>Powertrain</dt><dd>{vehicle.fuelType}</dd></div>}{vehicle.transmission && <div><dt>Transmission</dt><dd>{vehicle.transmission}</dd></div>}{vehicle.exteriorColor && <div><dt>Exterior</dt><dd>{vehicle.exteriorColor}</dd></div>}{vehicle.seatingCapacity !== undefined && <div><dt>Seats</dt><dd>{vehicle.seatingCapacity}</dd></div>}</dl></div>
          {vehicle.description ? <p className="detail-description">{vehicle.description}</p> : <p className="detail-disclaimer">Additional technical specifications are not provided in the current inventory record.</p>}
        </section>
      </div>
      {related.length > 0 && <section className="related-vehicles"><div className="section-heading"><div><p className="eyebrow">Continue exploring</p><h2>More from Northline</h2></div><Link to="/" className="text-link">View all inventory →</Link></div><div className="related-grid">{related.map((item) => <VehicleCard key={item.id} vehicle={item} isAdmin={false} busy={false} onAddToCart={onAddToCart} onEdit={() => undefined} onDelete={() => undefined} onRestock={() => undefined} />)}</div></section>}
    </div>
  );
}
