import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { VehicleCard } from './VehicleCard';
import type { Vehicle } from '../types/api';

const base: Vehicle = { id: '1', make: 'Toyota', model: 'Camry', category: 'Sedan', price: 28000, quantityInStock: 0, createdAt: '', updatedAt: '' };

describe('VehicleCard', () => {
  it('disables purchase when stock is zero', () => {
    render(<MemoryRouter><VehicleCard vehicle={base} isAdmin={false} busy={false} onAddToCart={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} onRestock={vi.fn()} /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Unavailable' })).toBeDisabled();
  });

  it('shows admin controls only for administrators', () => {
    const { rerender } = render(<MemoryRouter><VehicleCard vehicle={{ ...base, quantityInStock: 2 }} isAdmin={false} busy={false} onAddToCart={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} onRestock={vi.fn()} /></MemoryRouter>);
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    rerender(<MemoryRouter><VehicleCard vehicle={{ ...base, quantityInStock: 2 }} isAdmin busy={false} onAddToCart={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} onRestock={vi.fn()} /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restock' })).toBeInTheDocument();
  });

  it('links to the selected vehicle without coupling the cart action to navigation', async () => {
    const add = vi.fn();
    render(<MemoryRouter><VehicleCard vehicle={{ ...base, quantityInStock: 2 }} isAdmin={false} busy={false} onAddToCart={add} onEdit={vi.fn()} onDelete={vi.fn()} onRestock={vi.fn()} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'View details for Toyota Camry' })).toHaveAttribute('href', '/vehicles/1');
    screen.getByRole('button', { name: 'Add to cart' }).click();
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
  });
});
