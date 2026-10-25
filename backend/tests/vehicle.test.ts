import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { signToken } from '../src/auth/token.js';
import type { UserRecord } from '../src/auth/types.js';
import type { CreateVehicleInput, VehicleRecord, VehicleRepository } from '../src/vehicles/types.js';
import { InMemoryUserRepository } from './support/in-memory-user-repository.js';

class InMemoryVehicleRepository implements VehicleRepository {
  private readonly vehicles = new Map<string, VehicleRecord>();

  clear() {
    this.vehicles.clear();
  }

  seed(vehicle: VehicleRecord) {
    this.vehicles.set(vehicle.id, vehicle);
  }

  list(filters: { make?: string; model?: string; category?: string; minPrice?: number; maxPrice?: number } = {}) {
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
}

const users = new InMemoryUserRepository();
const vehicles = new InMemoryVehicleRepository();
const app = createApp({ userRepository: users, vehicleRepository: vehicles });

const regularUser: UserRecord = {
  id: 'user-id',
  email: 'user@example.com',
  passwordHash: 'not-used-in-api-tests',
  role: 'user',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const adminUser: UserRecord = { ...regularUser, id: 'admin-id', email: 'admin@example.com', role: 'admin' };

function tokenFor(user: UserRecord) {
  return signToken({ sub: user.id, email: user.email, role: user.role });
}

function vehicle(overrides: Partial<VehicleRecord> = {}): VehicleRecord {
  return {
    id: 'vehicle-1',
    make: 'Toyota',
    model: 'Camry',
    category: 'Sedan',
    price: 28000,
    quantityInStock: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  users.clear();
  users.seed(regularUser);
  users.seed(adminUser);
  vehicles.clear();
});

describe('vehicle authentication and creation', () => {
  it('requires authentication to create a vehicle', async () => {
    const response = await request(app).post('/api/vehicles').send({
      make: 'Toyota', model: 'Camry', category: 'Sedan', price: 28000, quantityInStock: 4,
    });

    expect(response.status).toBe(401);
  });

  it('creates a valid vehicle', async () => {
    const response = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${tokenFor(regularUser)}`)
      .send({ make: 'Toyota', model: 'Camry', category: 'Sedan', price: 28000, quantityInStock: 4 });

    expect(response.status).toBe(201);
    expect(response.body.vehicle).toMatchObject({ make: 'Toyota', model: 'Camry', price: 28000, quantityInStock: 4 });
    expect(response.body.vehicle.id).toEqual(expect.any(String));
  });

  it.each([
    [{ make: '', model: 'Camry', category: 'Sedan', price: 28000, quantityInStock: 4 }],
    [{ make: 'Toyota', model: 'Camry', category: 'Sedan', price: -1, quantityInStock: 4 }],
    [{ make: 'Toyota', model: 'Camry', category: 'Sedan', price: 28000, quantityInStock: -1 }],
    [{ make: 'Toyota', model: 'Camry', category: 'Sedan', price: 'not-a-number', quantityInStock: 4 }],
  ])('rejects invalid vehicle input: %j', async (payload) => {
    const response = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${tokenFor(regularUser)}`)
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('vehicle listing and search', () => {
  beforeEach(() => {
    vehicles.seed(vehicle({ id: 'toyota-sedan', make: 'Toyota', model: 'Camry', category: 'Sedan', price: 28000 }));
    vehicles.seed(vehicle({ id: 'honda-suv', make: 'Honda', model: 'CR-V', category: 'SUV', price: 31000 }));
    vehicles.seed(vehicle({ id: 'toyota-suv', make: 'Toyota', model: 'RAV4', category: 'SUV', price: 31000 }));
  });

  it('lists all vehicles', async () => {
    const response = await request(app).get('/api/vehicles').set('Authorization', `Bearer ${tokenFor(regularUser)}`);

    expect(response.status).toBe(200);
    expect(response.body.vehicles).toHaveLength(3);
  });

  it.each([
    ['make', 'toyota', 2],
    ['model', 'CR-V', 1],
    ['category', 'suv', 2],
    ['minPrice', '31000', 2],
    ['maxPrice', '28000', 1],
  ])('searches by %s', async (field, value, count) => {
    const response = await request(app)
      .get('/api/vehicles/search')
      .query({ [field]: value })
      .set('Authorization', `Bearer ${tokenFor(regularUser)}`);

    expect(response.status).toBe(200);
    expect(response.body.vehicles).toHaveLength(count);
  });

  it('supports combined filters and inclusive price boundaries', async () => {
    const response = await request(app)
      .get('/api/vehicles/search')
      .query({ make: 'Toyota', category: 'SUV', minPrice: 31000, maxPrice: 31000 })
      .set('Authorization', `Bearer ${tokenFor(regularUser)}`);

    expect(response.status).toBe(200);
    expect(response.body.vehicles).toEqual([expect.objectContaining({ id: 'toyota-suv' })]);
  });

  it('returns an empty result for no matches', async () => {
    const response = await request(app)
      .get('/api/vehicles/search')
      .query({ make: 'Ford' })
      .set('Authorization', `Bearer ${tokenFor(regularUser)}`);

    expect(response.status).toBe(200);
    expect(response.body.vehicles).toEqual([]);
  });
});

describe('vehicle update and deletion', () => {
  beforeEach(() => vehicles.seed(vehicle()));

  it('updates an existing vehicle', async () => {
    const response = await request(app)
      .put('/api/vehicles/vehicle-1')
      .set('Authorization', `Bearer ${tokenFor(regularUser)}`)
      .send({ price: 26500, quantityInStock: 2 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle).toMatchObject({ price: 26500, quantityInStock: 2 });
  });

  it('returns 404 for updating a nonexistent vehicle', async () => {
    const response = await request(app)
      .put('/api/vehicles/missing')
      .set('Authorization', `Bearer ${tokenFor(regularUser)}`)
      .send({ price: 26500 });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('VEHICLE_NOT_FOUND');
  });

  it('denies deletion to regular users', async () => {
    const response = await request(app)
      .delete('/api/vehicles/vehicle-1')
      .set('Authorization', `Bearer ${tokenFor(regularUser)}`);

    expect(response.status).toBe(403);
  });

  it('allows administrators to delete a vehicle', async () => {
    const response = await request(app)
      .delete('/api/vehicles/vehicle-1')
      .set('Authorization', `Bearer ${tokenFor(adminUser)}`);

    expect(response.status).toBe(204);
    expect(vehicles.findById('vehicle-1')).toBeNull();
  });

  it('returns 404 when an administrator deletes a nonexistent vehicle', async () => {
    const response = await request(app)
      .delete('/api/vehicles/missing')
      .set('Authorization', `Bearer ${tokenFor(adminUser)}`);

    expect(response.status).toBe(404);
  });
});
