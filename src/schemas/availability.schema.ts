import { z } from 'zod';

export const availabilitySchema = {
  query: z.object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
    serviceId: z.coerce.number().int().positive(),
  }),
};

export type AvailabilityQuery = z.infer<typeof availabilitySchema.query>;
