import { AppError } from '../auth/errors.js';

export class OutOfStockError extends AppError {
  constructor() {
    super(409, 'OUT_OF_STOCK', 'Vehicle is out of stock');
  }
}

