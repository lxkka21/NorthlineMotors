import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { signToken } from '../src/auth/token.js';
import type { UserRecord } from '../src/auth/types.js';
import type { CheckoutInput, Order, OrderRepository } from '../src/orders/types.js';
import type { VehicleRecord } from '../src/vehicles/types.js';
import { InMemoryUserRepository } from './support/in-memory-user-repository.js';

class InMemoryOrderRepository implements OrderRepository {
  private readonly vehicles = new Map<string, VehicleRecord>();
  private readonly orders = new Map<string, Order>();
  fail = false;

  clear() { this.vehicles.clear(); this.orders.clear(); this.fail = false; }
  seedVehicle(vehicle: VehicleRecord) { this.vehicles.set(vehicle.id, vehicle); }
  getVehicle(id: string) { return this.vehicles.get(id); }

  checkout(userId: string, input: CheckoutInput) {
    if (this.fail) throw new Error('DATABASE_FAILURE');
    const existing = [...this.orders.values()].find((order) => order.userId === userId && order.idempotencyKey === input.idempotencyKey);
    if (existing) return existing;

    const snapshots = input.items.map((item) => {
      const vehicle = this.vehicles.get(item.vehicleId);
      if (!vehicle) throw new Error('VEHICLE_NOT_FOUND');
      if (vehicle.quantityInStock < item.quantity) throw new Error('INSUFFICIENT_STOCK');
      return { vehicle, quantity: item.quantity };
    });
    for (const snapshot of snapshots) {
      const current = this.vehicles.get(snapshot.vehicle.id)!;
      this.vehicles.set(current.id, { ...current, quantityInStock: current.quantityInStock - snapshot.quantity });
    }
    const now = new Date().toISOString();
    const order: Order = {
      id: `order-${this.orders.size + 1}`,
      orderNumber: `NM-${String(this.orders.size + 1).padStart(6, '0')}`,
      userId,
      customerName: input.customerName,
      contact: input.contact,
      fulfillment: input.fulfillment,
      status: 'confirmed',
      total: snapshots.reduce((sum, item) => sum + item.vehicle.price * item.quantity, 0),
      idempotencyKey: input.idempotencyKey,
      createdAt: now,
      updatedAt: now,
      items: snapshots.map(({ vehicle, quantity }, index) => ({
        id: `item-${this.orders.size + 1}-${index + 1}`,
        orderId: `order-${this.orders.size + 1}`,
        vehicleId: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        category: vehicle.category,
        year: vehicle.year,
        unitPrice: vehicle.price,
        quantity,
      })),
    };
    this.orders.set(order.id, order);
    return order;
  }

  listByUser(userId: string, canViewAll: boolean) {
    return [...this.orders.values()].filter((order) => canViewAll || order.userId === userId);
  }

  findById(id: string, userId: string, canViewAll: boolean) {
    const order = this.orders.get(id);
    return order && (canViewAll || order.userId === userId) ? order : null;
  }
}

const users = new InMemoryUserRepository();
const orders = new InMemoryOrderRepository();
const app = createApp({ userRepository: users, orderRepository: orders });
const customer: UserRecord = { id: 'customer-id', email: 'customer@example.com', passwordHash: 'unused', role: 'user', createdAt: '', updatedAt: '' };
const otherCustomer: UserRecord = { ...customer, id: 'other-customer-id', email: 'other@example.com' };
const admin: UserRecord = { ...customer, id: 'admin-id', email: 'admin@example.com', role: 'admin' };

function tokenFor(user: UserRecord) { return signToken({ sub: user.id, email: user.email, role: user.role }); }
function vehicle(quantityInStock = 3): VehicleRecord {
  return { id: 'vehicle-1', make: 'Toyota', model: 'Camry', category: 'Sedan', year: 2025, price: 28000, quantityInStock, createdAt: '', updatedAt: '' };
}

beforeEach(() => {
  users.clear();
  users.seed(customer); users.seed(otherCustomer); users.seed(admin);
  orders.clear(); orders.seedVehicle(vehicle());
});

describe('POST /api/orders', () => {
  it('creates one server-priced order and decrements stock', async () => {
    const response = await request(app).post('/api/orders').set('Authorization', `Bearer ${tokenFor(customer)}`).send({
      customerName: 'A Customer', contact: 'customer@example.com', fulfillment: 'pickup', idempotencyKey: 'checkout-key-0001',
      items: [{ vehicleId: 'vehicle-1', quantity: 2, unitPrice: 1 }],
    });
    expect(response.status).toBe(201);
    expect(response.body.order.total).toBe(56000);
    expect(response.body.order.items[0].unitPrice).toBe(28000);
    expect(orders.getVehicle('vehicle-1')?.quantityInStock).toBe(1);
  });

  it('rejects invalid quantity and insufficient stock', async () => {
    const invalid = await request(app).post('/api/orders').set('Authorization', `Bearer ${tokenFor(customer)}`).send({
      customerName: 'A Customer', contact: 'customer@example.com', fulfillment: 'pickup', idempotencyKey: 'bad-key-00000001', items: [{ vehicleId: 'vehicle-1', quantity: 0 }],
    });
    const insufficient = await request(app).post('/api/orders').set('Authorization', `Bearer ${tokenFor(customer)}`).send({
      customerName: 'A Customer', contact: 'customer@example.com', fulfillment: 'pickup', idempotencyKey: 'bad-key-00000002', items: [{ vehicleId: 'vehicle-1', quantity: 4 }],
    });
    expect(invalid.status).toBe(400);
    expect(insufficient.status).toBe(409);
    expect(orders.getVehicle('vehicle-1')?.quantityInStock).toBe(3);
  });

  it('requires authentication and makes repeated submissions idempotent', async () => {
    const unauthenticated = await request(app).post('/api/orders').send({});
    const input = { customerName: 'A Customer', contact: 'customer@example.com', fulfillment: 'delivery', idempotencyKey: 'same-key-00000001', items: [{ vehicleId: 'vehicle-1', quantity: 1 }] };
    const first = await request(app).post('/api/orders').set('Authorization', `Bearer ${tokenFor(customer)}`).send(input);
    const second = await request(app).post('/api/orders').set('Authorization', `Bearer ${tokenFor(customer)}`).send(input);
    expect(unauthenticated.status).toBe(401);
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.order.id).toBe(first.body.order.id);
    expect(orders.getVehicle('vehicle-1')?.quantityInStock).toBe(2);
  });

  it('allows only one checkout for the final unit across concurrent requests', async () => {
    orders.seedVehicle({ ...vehicle(1), id: 'final-unit' });
    const input = { customerName: 'A Customer', contact: 'customer@example.com', fulfillment: 'pickup' as const, items: [{ vehicleId: 'final-unit', quantity: 1 }] };
    const responses = await Promise.all([
      request(app).post('/api/orders').set('Authorization', `Bearer ${tokenFor(customer)}`).send({ ...input, idempotencyKey: 'concurrent-key-0001' }),
      request(app).post('/api/orders').set('Authorization', `Bearer ${tokenFor(otherCustomer)}`).send({ ...input, idempotencyKey: 'concurrent-key-0002' }),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(orders.getVehicle('final-unit')?.quantityInStock).toBe(0);
  });

  it('rolls back when the database operation fails', async () => {
    orders.fail = true;
    const response = await request(app).post('/api/orders').set('Authorization', `Bearer ${tokenFor(customer)}`).send({
      customerName: 'A Customer', contact: 'customer@example.com', fulfillment: 'pickup', idempotencyKey: 'fail-key-00000001', items: [{ vehicleId: 'vehicle-1', quantity: 1 }],
    });
    expect(response.status).toBe(500);
    expect(orders.getVehicle('vehicle-1')?.quantityInStock).toBe(3);
  });
});

describe('GET /api/orders', () => {
  it('returns only the authenticated customer orders and supports admin access', async () => {
    await request(app).post('/api/orders').set('Authorization', `Bearer ${tokenFor(customer)}`).send({
      customerName: 'A Customer', contact: 'customer@example.com', fulfillment: 'pickup', idempotencyKey: 'history-key-000001', items: [{ vehicleId: 'vehicle-1', quantity: 1 }],
    });
    const own = await request(app).get('/api/orders').set('Authorization', `Bearer ${tokenFor(customer)}`);
    const other = await request(app).get('/api/orders').set('Authorization', `Bearer ${tokenFor(otherCustomer)}`);
    const admins = await request(app).get('/api/orders').set('Authorization', `Bearer ${tokenFor(admin)}`);
    expect(own.body.orders).toHaveLength(1);
    expect(other.body.orders).toHaveLength(0);
    expect(admins.body.orders).toHaveLength(1);
  });

  it('does not expose another customer order by id', async () => {
    const created = await request(app).post('/api/orders').set('Authorization', `Bearer ${tokenFor(customer)}`).send({
      customerName: 'A Customer', contact: 'customer@example.com', fulfillment: 'pickup', idempotencyKey: 'private-key-000001', items: [{ vehicleId: 'vehicle-1', quantity: 1 }],
    });
    const response = await request(app).get(`/api/orders/${created.body.order.id}`).set('Authorization', `Bearer ${tokenFor(otherCustomer)}`);
    expect(response.status).toBe(404);
  });
});
