import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VehicleFilters } from './VehicleFilters';

const vehicles = [
  { id: '1', make: 'Toyota', model: 'Camry', category: 'Sedan', price: 28000, quantityInStock: 2, createdAt: '', updatedAt: '' },
  { id: '2', make: 'Toyota', model: 'RAV4', category: 'SUV', price: 34000, quantityInStock: 0, createdAt: '', updatedAt: '' },
];

describe('VehicleFilters', () => {
  it('supports dependent model options and applying combined filters', () => {
    const onApply = vi.fn();
    render(<VehicleFilters filters={{}} vehicles={vehicles} onApply={onApply} onClear={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Filter by make'), { target: { value: 'Toyota' } });
    fireEvent.change(screen.getByLabelText('Filter by availability'), { target: { value: 'true' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
    expect(onApply).toHaveBeenCalledWith({ make: 'Toyota', inStock: 'true' });
    expect(document.querySelector('datalist#northline-models option[value="Camry"]')).toBeInTheDocument();
    expect(document.querySelector('datalist#northline-models option[value="RAV4"]')).toBeInTheDocument();
  });

  it('clears all filters', () => {
    const onClear = vi.fn();
    render(<VehicleFilters filters={{ make: 'Toyota' }} vehicles={vehicles} onApply={vi.fn()} onClear={onClear} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
