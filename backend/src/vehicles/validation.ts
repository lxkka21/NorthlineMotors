import { z } from 'zod';

const textField = z.string().trim().min(1).max(100);

export const createVehicleSchema = z.object({
  make: textField,
  model: textField,
  category: textField,
  price: z.number().finite().min(0),
  quantityInStock: z.number().int().min(0),
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
  })
  .refine((value) => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice, {
    message: 'minPrice cannot be greater than maxPrice',
    path: ['maxPrice'],
  });

