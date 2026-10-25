import { supabase } from '../lib/supabase.js';
import type { InventoryRepository, PurchaseResult } from './types.js';
import type { VehicleRecord } from '../vehicles/types.js';

type VehicleRow = {
  id: string;
  make: string;
  model: string;
  category: string;
  price: number | string;
  quantity_in_stock: number;
  created_at: string;
  updated_at: string;
};

function mapVehicle(row: VehicleRow): VehicleRecord {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    category: row.category,
    price: Number(row.price),
    quantityInStock: row.quantity_in_stock,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInventoryError(error: { code?: string; message?: string }): PurchaseResult | null {
  const message = error.message ?? '';
  if (error.code === 'P0002' || message.includes('VEHICLE_NOT_FOUND')) return { kind: 'not_found' };
  if (error.code === 'P0001' || message.includes('OUT_OF_STOCK')) return { kind: 'out_of_stock' };
  return null;
}

export class SupabaseInventoryRepository implements InventoryRepository {
  async purchase(id: string): Promise<PurchaseResult> {
    const { data, error } = await supabase.rpc('purchase_vehicle', { p_vehicle_id: id });
    if (error) {
      const mapped = mapInventoryError(error);
      if (mapped) return mapped;
      throw error;
    }
    return { kind: 'success', vehicle: mapVehicle(data as VehicleRow) };
  }

  async restock(id: string, quantity: number) {
    const { data, error } = await supabase.rpc('restock_vehicle', { p_vehicle_id: id, p_quantity: quantity });
    if (error) {
      if (error.code === 'P0002' || error.message?.includes('VEHICLE_NOT_FOUND')) return null;
      throw error;
    }
    return mapVehicle(data as VehicleRow);
  }
}

