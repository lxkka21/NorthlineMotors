import { AppError } from '../auth/errors.js';

export class OrderNotFoundError extends AppError {
  constructor() { super(404, 'ORDER_NOT_FOUND', 'Order not found'); }
}

export class InsufficientStockError extends AppError {
  constructor() { super(409, 'INSUFFICIENT_STOCK', 'One or more vehicles do not have enough stock'); }
}

export class OrderVehicleNotFoundError extends AppError {
  constructor() { super(404, 'VEHICLE_NOT_FOUND', 'One or more selected vehicles were not found'); }
}
