import type { VehicleRecord } from '../vehicles/types.js';

export type PurchaseResult =
  | { kind: 'success'; vehicle: VehicleRecord }
  | { kind: 'not_found' }
  | { kind: 'out_of_stock' };

export interface InventoryRepository {
  purchase(id: string): PurchaseResult | Promise<PurchaseResult>;
  restock(id: string, quantity: number): VehicleRecord | null | Promise<VehicleRecord | null>;
}

