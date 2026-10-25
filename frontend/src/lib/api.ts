import type { CheckoutInput, Order, RegistrationInput, SessionResponse, User, Vehicle, VehicleFilters, VehicleInput } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.error?.code ?? 'REQUEST_FAILED',
      body?.error?.message ?? 'Something went wrong. Please try again.',
    );
  }
  return body as T;
}

function json(method: string, body: unknown): RequestInit {
  return { method, body: JSON.stringify(body) };
}

export const api = {
  register: (input: RegistrationInput) => request<SessionResponse>('/auth/register', json('POST', input)),
  login: (email: string, password: string) => request<SessionResponse>('/auth/login', json('POST', { email, password })),
  me: (token: string) => request<{ user: User }>('/auth/me', {}, token),
  listUsers: (token: string) => request<{ users: User[] }>('/auth/users', {}, token),
  assignRole: (token: string, id: string, role: User['role']) => request<{ user: User }>(`/auth/users/${id}/role`, json('PATCH', { role }), token),
  listVehicles: (token: string, filters: VehicleFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    const query = params.toString();
    return request<{ vehicles: Vehicle[] }>(query ? `/vehicles/search?${query}` : '/vehicles', {}, token);
  },
  getVehicle: (token: string, id: string) => request<{ vehicle: Vehicle }>(`/vehicles/${id}`, {}, token),
  createVehicle: (token: string, input: VehicleInput) => request<{ vehicle: Vehicle }>('/vehicles', json('POST', input), token),
  updateVehicle: (token: string, id: string, input: Partial<VehicleInput>) => request<{ vehicle: Vehicle }>(`/vehicles/${id}`, json('PUT', input), token),
  deleteVehicle: (token: string, id: string) => request<void>(`/vehicles/${id}`, { method: 'DELETE' }, token),
  purchase: (token: string, id: string) => request<{ vehicle: Vehicle }>(`/vehicles/${id}/purchase`, json('POST', {}), token),
  restock: (token: string, id: string, quantity: number) => request<{ vehicle: Vehicle }>(`/vehicles/${id}/restock`, json('POST', { quantity }), token),
  createOrder: (token: string, input: CheckoutInput) => request<{ order: Order }>('/orders', json('POST', input), token),
  listOrders: (token: string) => request<{ orders: Order[] }>('/orders', {}, token),
  getOrder: (token: string, id: string) => request<{ order: Order }>(`/orders/${id}`, {}, token),
};
