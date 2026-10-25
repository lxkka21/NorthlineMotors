import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const session = { token: 'test-token', user: { id: 'admin', email: 'admin@example.com', role: 'admin' as const } };
const vehicle = { id: 'vehicle-1', make: 'Toyota', model: 'Camry', category: 'Sedan', price: 28000, quantityInStock: 2, createdAt: '', updatedAt: '' };

function response(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('App', () => {
  it('loads actual API vehicles and exposes admin actions', async () => {
    localStorage.setItem('northline.session', JSON.stringify(session));
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(response({ vehicles: [vehicle] }) as Response);
    render(<App />);

    expect(await screen.findByText('Toyota Camry')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Add vehicle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restock' })).toBeInTheDocument();
  });

  it('shows loading and API error states', async () => {
    localStorage.setItem('northline.session', JSON.stringify(session));
    let resolveRequest!: (value: Response) => void;
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }) as Promise<Response>);
    render(<App />);
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    resolveRequest(response({ error: { code: 'DATABASE_ERROR', message: 'Inventory unavailable' } }, false, 500) as Response);
    expect(await screen.findByRole('alert')).toHaveTextContent('Inventory unavailable');
  });

  it('opens the admin add-vehicle form', async () => {
    localStorage.setItem('northline.session', JSON.stringify(session));
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(response({ vehicles: [] }) as Response);
    render(<App />);
    await waitFor(() => expect(screen.getByRole('button', { name: '+ Add vehicle' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: '+ Add vehicle' }));
    expect(screen.getByRole('button', { name: 'Add to inventory' })).toBeInTheDocument();
  });
});

