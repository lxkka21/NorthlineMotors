import { ValidationError } from '../auth/errors.js';
import { VehicleNotFoundError } from '../vehicles/errors.js';
import { OutOfStockError } from './errors.js';
import { restockSchema } from './validation.js';
import type { InventoryRepository } from './types.js';

export class InventoryService {
  constructor(private readonly inventory: InventoryRepository) {}

  async purchase(id: string) {
    const result = await this.inventory.purchase(id);
    if (result.kind === 'not_found') throw new VehicleNotFoundError();
    if (result.kind === 'out_of_stock') throw new OutOfStockError();
    return result.vehicle;
  }

  async restock(id: string, input: unknown) {
    const parsed = restockSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError('Restock quantity must be a positive integer');
    const vehicle = await this.inventory.restock(id, parsed.data.quantity);
    if (!vehicle) throw new VehicleNotFoundError();
    return vehicle;
  }
}

