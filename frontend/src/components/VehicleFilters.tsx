import type { VehicleFilters as Filters } from '../types/api';

interface VehicleFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onClear: () => void;
}

export function VehicleFilters({ filters, onChange, onClear }: VehicleFiltersProps) {
  const update = (key: keyof Filters, value: string) => onChange({ ...filters, [key]: value || undefined });
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5">
      <input aria-label="Search make" value={filters.make ?? ''} onChange={(event) => update('make', event.target.value)} placeholder="Make" className="field" />
      <input aria-label="Search model" value={filters.model ?? ''} onChange={(event) => update('model', event.target.value)} placeholder="Model" className="field" />
      <input aria-label="Search category" value={filters.category ?? ''} onChange={(event) => update('category', event.target.value)} placeholder="Category" className="field" />
      <input aria-label="Minimum price" type="number" min="0" value={filters.minPrice ?? ''} onChange={(event) => update('minPrice', event.target.value)} placeholder="Min price" className="field" />
      <div className="flex gap-2"><input aria-label="Maximum price" type="number" min="0" value={filters.maxPrice ?? ''} onChange={(event) => update('maxPrice', event.target.value)} placeholder="Max price" className="field min-w-0 flex-1" /><button type="button" onClick={onClear} className="rounded-xl px-3 text-sm font-bold text-slate-500 hover:bg-slate-100">Clear</button></div>
    </div>
  );
}

