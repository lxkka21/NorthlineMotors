import { z } from 'zod';

const textField = z.string().trim().min(1).max(200);

export const checkoutSchema = z.object({
  customerName: textField.max(120),
  contact: textField.max(200),
  fulfillment: z.enum(['pickup', 'delivery']),
  idempotencyKey: z.string().trim().min(16).max(120),
  items: z.array(z.object({
    vehicleId: z.string().trim().min(1).max(100),
    quantity: z.number().int().min(1).max(100),
  })).min(1).max(20).refine((items) => new Set(items.map((item) => item.vehicleId)).size === items.length, {
    message: 'Each vehicle may appear only once in an order',
  }),
});
