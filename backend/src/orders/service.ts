import { ValidationError } from '../auth/errors.js';
import { InsufficientStockError, OrderNotFoundError, OrderVehicleNotFoundError } from './errors.js';
import { checkoutSchema } from './validation.js';
import type { OrderRepository } from './types.js';

export class OrderService {
  constructor(private readonly orders: OrderRepository) {}

  async create(userId: string, input: unknown) {
    const parsed = checkoutSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError('Checkout details and order items are invalid');
    try {
      return await this.orders.checkout(userId, parsed.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('VEHICLE_NOT_FOUND')) throw new OrderVehicleNotFoundError();
      if (message.includes('INSUFFICIENT_STOCK') || message.includes('OUT_OF_STOCK')) throw new InsufficientStockError();
      throw error;
    }
  }

  async list(userId: string, canViewAll: boolean) {
    return this.orders.listByUser(userId, canViewAll);
  }

  async get(id: string, userId: string, canViewAll: boolean) {
    const order = await this.orders.findById(id, userId, canViewAll);
    if (!order) throw new OrderNotFoundError();
    return order;
  }
}
