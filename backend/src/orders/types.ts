import type { VehicleRecord } from '../vehicles/types.js';

export type OrderStatus = 'confirmed' | 'cancelled' | 'completed';

export interface CheckoutItemInput {
  vehicleId: string;
  quantity: number;
}

export interface CheckoutInput {
  customerName: string;
  contact: string;
  fulfillment: 'pickup' | 'delivery';
  idempotencyKey: string;
  items: CheckoutItemInput[];
}

export interface OrderItemRecord {
  id: string;
  orderId: string;
  vehicleId: string | null;
  make: string;
  model: string;
  category: string;
  year?: number;
  unitPrice: number;
  quantity: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  contact: string;
  fulfillment: 'pickup' | 'delivery';
  status: OrderStatus;
  total: number;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItemRecord[];
}

export interface OrderRepository {
  checkout(userId: string, input: CheckoutInput): OrderRecord | Promise<OrderRecord>;
  listByUser(userId: string, canViewAll: boolean): OrderRecord[] | Promise<OrderRecord[]>;
  findById(id: string, userId: string, canViewAll: boolean): OrderRecord | null | Promise<OrderRecord | null>;
}

export type CheckoutVehicleSnapshot = Pick<VehicleRecord, 'id' | 'make' | 'model' | 'category' | 'year' | 'price'>;
