export interface VehicleRecord {
  id: string;
  make: string;
  model: string;
  category: string;
  year?: number;
  price: number;
  quantityInStock: number;
  createdAt: string;
  updatedAt: string;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  exteriorColor?: string;
  engineDetails?: string;
  seatingCapacity?: number;
}

export interface CreateVehicleInput {
  make: string;
  model: string;
  category: string;
  year?: number;
  price: number;
  quantityInStock: number;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  exteriorColor?: string;
  engineDetails?: string;
  seatingCapacity?: number;
}

export interface VehicleFilters {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface VehicleRepository {
  create(input: CreateVehicleInput): VehicleRecord | Promise<VehicleRecord>;
  list(filters?: VehicleFilters): VehicleRecord[] | Promise<VehicleRecord[]>;
  findById(id: string): VehicleRecord | null | Promise<VehicleRecord | null>;
  update(id: string, input: Partial<CreateVehicleInput>): VehicleRecord | null | Promise<VehicleRecord | null>;
  delete(id: string): boolean | Promise<boolean>;
}
