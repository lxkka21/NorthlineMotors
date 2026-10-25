import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { signToken } from '../src/auth/token.js';
import type { UserRecord } from '../src/auth/types.js';
import type { CreateVehicleInput, VehicleFilters, VehicleRecord, VehicleRepository } from '../src/vehicles/types.js';
import type { InventoryRepository } from '../src/inventory/types.js';
import { InMemoryUserRepository } from './support/in-memory-user-repository.js';

class InMemoryInventoryRepository implements VehicleRepository, InventoryRepository {
  private readonly vehicles = new Map<string, VehicleRecord>();
  failPurchase = false;
  failRestock = false;

  clear() {
    this.vehicles.clear();
    this.failPurchase = false;
    this.failRestock = false;
  }

  seed(vehicle: VehicleRecord) {
    this.vehicles.set(vehicle.id, vehicle);
  }

  create(input: CreateVehicleInput) {
    const vehicle: VehicleRecord = {
      id: `vehicle-${this.vehicles.size + 1}`,
      ...input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.vehicles.set(vehicle.id, vehicle);
    return vehicle;
  }

  list(filters: VehicleFilters = {}) {
    return [...this.vehicles.values()].filter((item) =>
      (!filters.make || item.make.toLowerCase().includes(filters.make.toLowerCase())) &&
      (!filters.model || item.model.toLowerCase().includes(filters.model.toLowerCase())) &&
      (!filters.category || item.category.toLowerCase().includes(filters.category.toLowerCase())) &&
      (filters.minPrice === undefined || item.price >= filters.minPrice) &&
      (filters.maxPrice === undefined || item.price <= filters.maxPrice),
    );
  }

  findById(id: string) {
    return this.vehicles.get(id) ?? null;
  }

  update(id: string, input: Partial<CreateVehicleInput>) {
    const current = this.vehicles.get(id);
    if (!current) return null;
    const updated = { ...current, ...input, updatedAt: new Date().toISOString() };
    this.vehicles.set(id, updated);
    return updated;
  }

  delete(id: string) {
    return this.vehicles.delete(id);
  }

  purchase(id: string) {
    if (this.failPurchase) throw new Error('DATABASE_FAILURE');
    const current = this.vehicles.get(id);
    if (!current) return { kind: 'not_found' as const };
    if (current.quantityInStock <= 0) return { kind: 'out_of_stock' as const };
    const updated = { ...current, quantityInStock: current.quantityInStock - 1 };
    this.vehicles.set(id, updated);
    return { kind: 'success' as const, vehicle: updated };
  }

  restock(id: string, quantity: number) {
    if (this.failRestock) throw new Error('DATABASE_FAILURE');
    const current = this.vehicles.get(id);
    if (!current) return null;
    const updated = { ...current, quantityInStock: current.quantityInStock + quantity };
    this.vehicles.set(id, updated);
    return updated;
  }
}

const users = new InMemoryUserRepository();
const vehicles = new InMemoryInventoryRepository();
const app = createApp({ userRepository: users, vehicleRepository: vehicles });

const regularUser: UserRecord = {
  id: 'user-id', email: 'user@example.com', passwordHash: 'unused', role: 'user',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};
const adminUser: UserRecord = { ...regularUser, id: 'admin-id', email: 'admin@example.com', role: 'admin' };

function tokenFor(user: UserRecord) {
  return signToken({ sub: user.id, email: user.email, role: user.role });
}

function vehicle(quantityInStock: number): VehicleRecord {
  return {
    id: 'vehicle-1', make: 'Toyota', model: 'Camry', category: 'Sedan', price: 28000, quantityInStock,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

beforeEach(() => {
  users.clear();
  users.seed(regularUser);
  users.seed(adminUser);
  vehicles.clear();
});

describe('POST /api/vehicles/:id/purchase', () => {
  it('decreases stock by exactly one', async () => {
    vehicles.seed(vehicle(2));
    const response = await request(app).post('/api/vehicles/vehicle-1/purchase')
      .set('Authorization', `Bearer ${tokenFor(regularUser)}`);

    expect(response.status).toBe(200);
    expect(response.body.vehicle.quantityInStock).toBe(1);
  });

  it('rejects an out-of-stock purchase without going negative', async () => {
    vehicles.seed(vehicle(0));
    const response = await request(app).post('/api/vehicles/vehicle-1/purchase')
      .set('Authorization', `Bearer ${tokenFor(regularUser)}`);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('OUT_OF_STOCK');
    expect(vehicles.findById('vehicle-1')?.quantityInStock).toBe(0);
  });

  it('rejects a nonexistent vehicle', async () => {
    const response = await request(app).post('/api/vehicles/missing/purchase')
      .set('Authorization', `Bearer ${tokenFor(regularUser)}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('VEHICLE_NOT_FOUND');
  });

  it('rejects database failures without changing inventory', async () => {
    vehicles.seed(vehicle(1));
    vehicles.failPurchase = true;
    const response = await request(app).post('/api/vehicles/vehicle-1/purchase')
      .set('Authorization', `Bearer ${tokenFor(regularUser)}`);

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(vehicles.findById('vehicle-1')?.quantityInStock).toBe(1);
  });

  it('allows only one of two simultaneous purchases for the final unit', async () => {
    vehicles.seed(vehicle(1));
    const responses = await Promise.all([
      request(app).post('/api/vehicles/vehicle-1/purchase').set('Authorization', `Bearer ${tokenFor(regularUser)}`),
      request(app).post('/api/vehicles/vehicle-1/purchase').set('Authorization', `Bearer ${tokenFor(regularUser)}`),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    expect(vehicles.findById('vehicle-1')?.quantityInStock).toBe(0);
  });
});

describe('POST /api/vehicles/:id/restock', () => {
  it('allows an administrator to restock by a positive quantity', async () => {
    vehicles.seed(vehicle(1));
    const response = await request(app).post('/api/vehicles/vehicle-1/restock')
      .set('Authorization', `Bearer ${tokenFor(adminUser)}`)
      .send({ quantity: 3 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle.quantityInStock).toBe(4);
  });

  it.each([{ quantity: 0 }, { quantity: -1 }, { quantity: 1.5 }, { quantity: 'three' }])('rejects invalid restock quantity %j', async (body) => {
    vehicles.seed(vehicle(1));
    const response = await request(app).post('/api/vehicles/vehicle-1/restock')
      .set('Authorization', `Bearer ${tokenFor(adminUser)}`).send(body);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects restocking a nonexistent vehicle', async () => {
    const response = await request(app).post('/api/vehicles/missing/restock')
      .set('Authorization', `Bearer ${tokenFor(adminUser)}`).send({ quantity: 2 });

    expect(response.status).toBe(404);
  });

  it('requires authentication and administrator authorization', async () => {
    vehicles.seed(vehicle(1));
    const unauthenticated = await request(app).post('/api/vehicles/vehicle-1/restock').send({ quantity: 2 });
    const forbidden = await request(app).post('/api/vehicles/vehicle-1/restock')
      .set('Authorization', `Bearer ${tokenFor(regularUser)}`).send({ quantity: 2 });

    expect(unauthenticated.status).toBe(401);
    expect(forbidden.status).toBe(403);
  });

  it('rejects database failures', async () => {
    vehicles.seed(vehicle(1));
    vehicles.failRestock = true;
    const response = await request(app).post('/api/vehicles/vehicle-1/restock')
      .set('Authorization', `Bearer ${tokenFor(adminUser)}`).send({ quantity: 2 });

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});

