import { supabase } from '../lib/supabase.js';
import type { CheckoutInput, OrderItemRecord, OrderRecord, OrderRepository, OrderStatus } from './types.js';

type OrderRow = {
  id: string; order_number: string; user_id: string; customer_name: string; contact: string;
  fulfillment: 'pickup' | 'delivery'; status: OrderStatus; total: number | string;
  idempotency_key: string; created_at: string; updated_at: string;
};
type ItemRow = {
  id: string; order_id: string; vehicle_id: string | null; make: string; model: string;
  category: string; year: number | null; unit_price: number | string; quantity: number;
};

function mapItem(row: ItemRow): OrderItemRecord {
  return { id: row.id, orderId: row.order_id, vehicleId: row.vehicle_id, make: row.make, model: row.model, category: row.category, year: row.year ?? undefined, unitPrice: Number(row.unit_price), quantity: row.quantity };
}

function mapOrder(row: OrderRow, items: ItemRow[]): OrderRecord {
  return { id: row.id, orderNumber: row.order_number, userId: row.user_id, customerName: row.customer_name, contact: row.contact, fulfillment: row.fulfillment, status: row.status, total: Number(row.total), idempotencyKey: row.idempotency_key, createdAt: row.created_at, updatedAt: row.updated_at, items: items.map(mapItem) };
}

export class SupabaseOrderRepository implements OrderRepository {
  private async withItems(row: OrderRow) {
    const { data, error } = await supabase.from('order_items').select('*').eq('order_id', row.id).order('created_at', { ascending: true });
    if (error) throw error;
    return mapOrder(row, (data ?? []) as ItemRow[]);
  }

  async checkout(userId: string, input: CheckoutInput) {
    const { data, error } = await supabase.rpc('create_order', {
      p_user_id: userId,
      p_customer_name: input.customerName,
      p_contact: input.contact,
      p_fulfillment: input.fulfillment,
      p_idempotency_key: input.idempotencyKey,
      p_items: input.items,
    });
    if (error) throw error;
    return this.withItems(data as OrderRow);
  }

  async listByUser(userId: string, canViewAll: boolean) {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100);
    if (!canViewAll) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return Promise.all(((data ?? []) as OrderRow[]).map((row) => this.withItems(row)));
  }

  async findById(id: string, userId: string, canViewAll: boolean) {
    let query = supabase.from('orders').select('*').eq('id', id);
    if (!canViewAll) query = query.eq('user_id', userId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data ? this.withItems(data as OrderRow) : null;
  }
}
