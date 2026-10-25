import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

const session = { token: 'test-token', user: { id: 'admin', email: 'admin@example.com', role: 'admin' as const } };
const vehicle = { id: 'vehicle-1', make: 'Toyota', model: 'Camry', category: 'Sedan', price: 28000, quantityInStock: 2, createdAt: '', updatedAt: '' };

function response(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

function mockAuthenticatedFetch(body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const path = String(input);
    if (path.includes('/auth/me')) return response({ user: session.user }) as Response;
    return response(body) as Response;
  });
}

function renderApp() {
  return render(<MemoryRouter><App /></MemoryRouter>);
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('App', () => {
  it('loads actual API vehicles and exposes admin actions', async () => {
    localStorage.setItem('northline.session', JSON.stringify(session));
    mockAuthenticatedFetch({ vehicles: [vehicle] });
    renderApp();

    expect(await screen.findByText('Toyota Camry')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Add vehicle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restock' })).toBeInTheDocument();
  });

  it('shows loading and API error states', async () => {
    localStorage.setItem('northline.session', JSON.stringify(session));
    let resolveRequest!: (value: Response) => void;
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      if (String(input).includes('/auth/me')) return Promise.resolve(response({ user: session.user }) as Response);
      return new Promise((resolve) => { resolveRequest = resolve; }) as Promise<Response>;
    });
    renderApp();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    resolveRequest(response({ error: { code: 'DATABASE_ERROR', message: 'Inventory unavailable' } }, false, 500) as Response);
    expect(await screen.findByRole('alert')).toHaveTextContent('Inventory unavailable');
  });

  it('opens the admin add-vehicle form', async () => {
    localStorage.setItem('northline.session', JSON.stringify(session));
    mockAuthenticatedFetch({ vehicles: [] });
    renderApp();
    await waitFor(() => expect(screen.getByRole('button', { name: '+ Add vehicle' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: '+ Add vehicle' }));
    expect(screen.getByRole('button', { name: 'Add to inventory' })).toBeInTheDocument();
  });

  it('loads a vehicle detail page from the card URL through the app router', async () => {
    localStorage.setItem('northline.session', JSON.stringify(session));
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const path = String(input);
      if (path.includes('/auth/me')) return response({ user: session.user }) as Response;
      if (path.includes('/vehicles/vehicle-1')) return response({ vehicle }) as Response;
      return response({ vehicles: [vehicle] }) as Response;
    });
    render(<MemoryRouter initialEntries={['/vehicles/vehicle-1']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Camry' })).toBeInTheDocument();
  });
});
