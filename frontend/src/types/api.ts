export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  preferredContactMethod?: 'email' | 'phone';
}

export interface SessionResponse {
  token: string;
  user: User;
}

export interface Vehicle {
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

export interface VehicleInput {
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

export interface RegistrationInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  dateOfBirth?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  preferredContactMethod?: 'email' | 'phone';
}

export interface VehicleFilters {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
}

export interface CartLine {
  vehicle: Vehicle;
  quantity: number;
}

export type OrderStatus = 'confirmed' | 'cancelled' | 'completed';

export interface OrderItem {
  id: string;
  orderId: string;
  vehicleId: string | null;
  make: string;
  model: string;
  category: string;
  year?: number;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  contact: string;
  fulfillment: 'pickup' | 'delivery';
  status: OrderStatus;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface CheckoutInput {
  customerName: string;
  contact: string;
  fulfillment: 'pickup' | 'delivery';
  idempotencyKey: string;
  items: Array<{ vehicleId: string; quantity: number }>;
}
