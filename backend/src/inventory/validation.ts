import { z } from 'zod';

export const restockSchema = z.object({
  quantity: z.number().int().positive().max(1_000_000),
});

