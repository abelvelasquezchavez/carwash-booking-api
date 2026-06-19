import { z } from 'zod';

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be in YYYY-MM-DD format');

export const revenueSchema = {
  query: z
    .object({
      from: dateOnly,
      to: dateOnly,
    })
    // ISO date strings compare correctly with a lexicographic <=.
    .refine((q) => q.from <= q.to, {
      message: 'from must be on or before to',
      path: ['from'],
    }),
};

export type RevenueQuery = z.infer<typeof revenueSchema.query>;
