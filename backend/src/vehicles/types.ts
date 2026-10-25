export interface VehicleRecord {
  id: string;
  make: string;
  model: string;
  category: string;
  price: number;
  quantityInStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleInput {
  make: string;
  model: string;
  category: string;
  price: number;
  quantityInStock: number;
}

export interface VehicleFilters {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface VehicleRepository {
  create(input: CreateVehicleInput): VehicleRecord | Promise<VehicleRecord>;
  list(filters?: VehicleFilters): VehicleRecord[] | Promise<VehicleRecord[]>;
  findById(id: string): VehicleRecord | null | Promise<VehicleRecord | null>;
  update(id: string, input: Partial<CreateVehicleInput>): VehicleRecord | null | Promise<VehicleRecord | null>;
  delete(id: string): boolean | Promise<boolean>;
}

