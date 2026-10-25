import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VehicleCard } from './VehicleCard';
import type { Vehicle } from '../types/api';

const base: Vehicle = { id: '1', make: 'Toyota', model: 'Camry', category: 'Sedan', price: 28000, quantityInStock: 0, createdAt: '', updatedAt: '' };

describe('VehicleCard', () => {
  it('disables purchase when stock is zero', () => {
    render(<VehicleCard vehicle={base} isAdmin={false} busy={false} onPurchase={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} onRestock={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Unavailable' })).toBeDisabled();
  });

  it('shows admin controls only for administrators', () => {
    const { rerender } = render(<VehicleCard vehicle={{ ...base, quantityInStock: 2 }} isAdmin={false} busy={false} onPurchase={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} onRestock={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    rerender(<VehicleCard vehicle={{ ...base, quantityInStock: 2 }} isAdmin busy={false} onPurchase={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} onRestock={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restock' })).toBeInTheDocument();
  });
});

