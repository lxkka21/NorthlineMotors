import { z } from 'zod';

const textField = z.string().trim().min(1).max(100);
const optionalText = z.string().trim().max(500).optional();
const urlField = z.string().url().max(2048).optional();

export const createVehicleSchema = z.object({
  make: textField,
  model: textField,
  category: textField,
  year: z.number().int().min(1886).max(2100).optional(),
  price: z.number().finite().min(0),
  quantityInStock: z.number().int().min(0),
  description: optionalText,
  imageUrl: urlField,
  imageUrls: z.array(z.string().url().max(2048)).max(12).optional(),
  mileage: z.number().int().min(0).max(2_000_000).optional(),
  fuelType: z.string().trim().max(50).optional(),
  transmission: z.string().trim().max(50).optional(),
  exteriorColor: z.string().trim().max(50).optional(),
  engineDetails: z.string().trim().max(200).optional(),
  seatingCapacity: z.number().int().min(1).max(20).optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one vehicle field is required',
});

export const searchVehicleSchema = z
  .object({
    make: z.string().trim().min(1).max(100).optional(),
    model: z.string().trim().min(1).max(100).optional(),
    category: z.string().trim().min(1).max(100).optional(),
    minPrice: z.coerce.number().finite().min(0).optional(),
    maxPrice: z.coerce.number().finite().min(0).optional(),
    inStock: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  })
  .refine((value) => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice, {
    message: 'minPrice cannot be greater than maxPrice',
    path: ['maxPrice'],
  });
