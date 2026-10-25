import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VehicleDetailPage } from './VehicleDetailPage';
import { api } from '../lib/api';
import type { Vehicle } from '../types/api';

vi.mock('../lib/api', () => ({ api: { getVehicle: vi.fn() } }));
const getVehicle = vi.mocked(api.getVehicle);
const base: Vehicle = { id: 'vehicle-1', make: 'Toyota', model: 'Camry', category: 'Sedan', year: 2024, price: 28000, quantityInStock: 2, createdAt: '', updatedAt: '' };

function renderPage(vehicle: Vehicle | null = base) {
  if (vehicle) getVehicle.mockResolvedValue({ vehicle });
  else getVehicle.mockRejectedValue(new Error('Vehicle not found'));
  return render(<MemoryRouter initialEntries={['/vehicles/vehicle-1']}><Routes><Route path="/vehicles/:id" element={<VehicleDetailPage token="test" catalog={[base]} onAddToCart={vi.fn()} onOpenCart={vi.fn()} />} /></Routes></MemoryRouter>);
}

describe('VehicleDetailPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads the vehicle by route id and shows real inventory fields', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Camry' })).toBeInTheDocument();
    expect(screen.getAllByText('$28,000')).toHaveLength(2);
    expect(screen.getByText('2 available now')).toBeInTheDocument();
    expect(getVehicle).toHaveBeenCalledWith('test', 'vehicle-1');
  });

  it('shows unavailable state and disables add to cart for zero stock', async () => {
    renderPage({ ...base, quantityInStock: 0 });
    await waitFor(() => expect(screen.getByText('Currently unavailable')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Unavailable' })).toBeDisabled();
  });

  it('switches to the local fallback when photography fails', async () => {
    renderPage();
    const image = await screen.findByRole('img', { name: 'Toyota Camry' });
    fireEvent.error(image);
    expect(image).toHaveAttribute('src', '/northline-vehicle-fallback.svg');
  });

  it('shows a not-found error from the API', async () => {
    renderPage(null);
    expect(await screen.findByRole('alert')).toHaveTextContent('Vehicle not found');
    expect(screen.getByRole('link', { name: 'Back to inventory' })).toHaveAttribute('href', '/');
  });
});
