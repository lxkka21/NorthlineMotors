import { useMemo, useState } from 'react';
import type { Vehicle, VehicleFilters as Filters } from '../types/api';

interface VehicleFiltersProps {
  filters: Filters;
  vehicles: Vehicle[];
  onApply: (filters: Filters) => void;
  onClear: () => void;
}

export function VehicleFilters({ filters, vehicles, onApply, onClear }: VehicleFiltersProps) {
  const [draft, setDraft] = useState<Filters>(filters);
  const [priceOpen, setPriceOpen] = useState(false);

  const makes = useMemo(() => [...new Set(vehicles.map((vehicle) => vehicle.make))].sort(), [vehicles]);
  const models = useMemo(() => [...new Set(vehicles.filter((vehicle) => !draft.make || vehicle.make.toLowerCase() === draft.make.toLowerCase()).map((vehicle) => vehicle.model))].sort(), [vehicles, draft.make]);
  const categories = useMemo(() => [...new Set(vehicles.map((vehicle) => vehicle.category))].sort(), [vehicles]);
  const activeCount = Object.values(filters).filter(Boolean).length;

  function update(key: keyof Filters, value: string) {
    setDraft((current) => ({ ...current, [key]: value || undefined, ...(key === 'make' ? { model: undefined } : {}) }));
  }

  return (
    <section className="filter-toolbar" aria-label="Inventory filters">
      <div className="filter-heading"><div><p className="eyebrow accent">Refine the collection</p><h3>Find the right line.</h3></div>{activeCount > 0 && <span className="active-filter-count">{activeCount} active</span>}</div>
      <div className="filter-fields">
        <label className="filter-field">Make<input list="northline-makes" aria-label="Filter by make" value={draft.make ?? ''} onChange={(event) => update('make', event.target.value)} placeholder="All makes" /><datalist id="northline-makes">{makes.map((make) => <option key={make} value={make} />)}</datalist></label>
        <label className="filter-field">Model<input list="northline-models" aria-label="Filter by model" value={draft.model ?? ''} onChange={(event) => update('model', event.target.value)} placeholder="All models" /><datalist id="northline-models">{models.map((model) => <option key={model} value={model} />)}</datalist></label>
        <label className="filter-field">Category<select aria-label="Filter by category" value={draft.category ?? ''} onChange={(event) => update('category', event.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
        <label className="filter-field">Availability<select aria-label="Filter by availability" value={draft.inStock ?? ''} onChange={(event) => update('inStock', event.target.value)}><option value="">All vehicles</option><option value="true">In stock</option><option value="false">Sold out</option></select></label>
        <div className="filter-price-wrap"><button type="button" className={`filter-price-button ${priceOpen ? 'open' : ''}`} aria-expanded={priceOpen} onClick={() => setPriceOpen((open) => !open)}>Price range <span>{draft.minPrice || draft.maxPrice ? '$ selected' : 'Any price'}</span></button>{priceOpen && <div className="filter-price-popover"><label className="filter-field">Minimum<input aria-label="Minimum price" inputMode="decimal" type="number" min="0" value={draft.minPrice ?? ''} onChange={(event) => update('minPrice', event.target.value)} placeholder="$0" /></label><label className="filter-field">Maximum<input aria-label="Maximum price" inputMode="decimal" type="number" min="0" value={draft.maxPrice ?? ''} onChange={(event) => update('maxPrice', event.target.value)} placeholder="No limit" /></label><button type="button" className="text-button" onClick={() => { update('minPrice', ''); update('maxPrice', ''); setPriceOpen(false); }}>Clear price</button></div>}</div>
      </div>
      <div className="filter-actions"><button type="button" className="primary-button filter-apply" onClick={() => onApply(draft)}>Apply filters</button><button type="button" className="text-button" onClick={() => { setDraft({}); onClear(); }}>Clear all</button></div>
    </section>
  );
}
