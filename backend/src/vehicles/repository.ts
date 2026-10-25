import { supabase } from '../lib/supabase.js';
import type { CreateVehicleInput, VehicleFilters, VehicleRecord, VehicleRepository } from './types.js';

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

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

export class SupabaseVehicleRepository implements VehicleRepository {
  async create(input: CreateVehicleInput) {
    const { data, error } = await supabase
      .from('vehicles')
      .insert({ make: input.make, model: input.model, category: input.category, price: input.price, quantity_in_stock: input.quantityInStock })
      .select('*')
      .single();
    if (error) throw error;
    return mapVehicle(data as VehicleRow);
  }

  async list(filters: VehicleFilters = {}) {
    let query = supabase.from('vehicles').select('*').order('created_at', { ascending: false });
    if (filters.make) query = query.ilike('make', `%${escapeLike(filters.make)}%`);
    if (filters.model) query = query.ilike('model', `%${escapeLike(filters.model)}%`);
    if (filters.category) query = query.ilike('category', `%${escapeLike(filters.category)}%`);
    if (filters.minPrice !== undefined) query = query.gte('price', filters.minPrice);
    if (filters.maxPrice !== undefined) query = query.lte('price', filters.maxPrice);
    const { data, error } = await query;
    if (error) throw error;
    return (data as VehicleRow[]).map(mapVehicle);
  }

  async findById(id: string) {
    const { data, error } = await supabase.from('vehicles').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapVehicle(data as VehicleRow) : null;
  }

  async update(id: string, input: Partial<CreateVehicleInput>) {
    const update = {
      ...(input.make === undefined ? {} : { make: input.make }),
      ...(input.model === undefined ? {} : { model: input.model }),
      ...(input.category === undefined ? {} : { category: input.category }),
      ...(input.price === undefined ? {} : { price: input.price }),
      ...(input.quantityInStock === undefined ? {} : { quantity_in_stock: input.quantityInStock }),
    };
    const { data, error } = await supabase.from('vehicles').update(update).eq('id', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? mapVehicle(data as VehicleRow) : null;
  }

  async delete(id: string) {
    const { data, error } = await supabase.from('vehicles').delete().eq('id', id).select('id').maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }
}

