import { supabase } from '../lib/supabase.js';
import type { CreateVehicleInput, VehicleFilters, VehicleRecord, VehicleRepository } from './types.js';

type VehicleRow = {
  id: string;
  make: string;
  model: string;
  category: string;
  year: number | null;
  price: number | string;
  quantity_in_stock: number;
  created_at: string;
  updated_at: string;
  description: string | null; image_url: string | null; image_urls: string[] | null; mileage: number | null; fuel_type: string | null; transmission: string | null; exterior_color: string | null; engine_details: string | null; seating_capacity: number | null;
};

function mapVehicle(row: VehicleRow): VehicleRecord {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    category: row.category,
    year: row.year ?? undefined,
    price: Number(row.price),
    quantityInStock: row.quantity_in_stock,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    description: row.description ?? undefined, imageUrl: row.image_url ?? undefined, imageUrls: row.image_urls ?? undefined, mileage: row.mileage ?? undefined, fuelType: row.fuel_type ?? undefined, transmission: row.transmission ?? undefined, exteriorColor: row.exterior_color ?? undefined, engineDetails: row.engine_details ?? undefined, seatingCapacity: row.seating_capacity ?? undefined,
  };
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

export class SupabaseVehicleRepository implements VehicleRepository {
  async create(input: CreateVehicleInput) {
    const { data, error } = await supabase
      .from('vehicles')
      .insert({ make: input.make, model: input.model, category: input.category, price: input.price, quantity_in_stock: input.quantityInStock, ...(input.year === undefined ? {} : { year: input.year }), description: input.description, image_url: input.imageUrl, image_urls: input.imageUrls, mileage: input.mileage, fuel_type: input.fuelType, transmission: input.transmission, exterior_color: input.exteriorColor, engine_details: input.engineDetails, seating_capacity: input.seatingCapacity })
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
    if (filters.inStock === true) query = query.gt('quantity_in_stock', 0);
    if (filters.inStock === false) query = query.eq('quantity_in_stock', 0);
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
      ...(input.year === undefined ? {} : { year: input.year }),
      ...(input.price === undefined ? {} : { price: input.price }),
      ...(input.quantityInStock === undefined ? {} : { quantity_in_stock: input.quantityInStock }),
      ...(input.description === undefined ? {} : { description: input.description }), ...(input.imageUrl === undefined ? {} : { image_url: input.imageUrl }), ...(input.imageUrls === undefined ? {} : { image_urls: input.imageUrls }), ...(input.mileage === undefined ? {} : { mileage: input.mileage }), ...(input.fuelType === undefined ? {} : { fuel_type: input.fuelType }), ...(input.transmission === undefined ? {} : { transmission: input.transmission }), ...(input.exteriorColor === undefined ? {} : { exterior_color: input.exteriorColor }), ...(input.engineDetails === undefined ? {} : { engine_details: input.engineDetails }), ...(input.seatingCapacity === undefined ? {} : { seating_capacity: input.seatingCapacity }),
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
