import { z } from 'zod';
import { idParamSchema } from './common.schema';

const priceSchema = z
  .number()
  .positive('Price must be greater than 0')
  .max(99999999.99, 'Price exceeds the allowed maximum');

export const listServicesSchema = {
  query: z.object({
    // Optional ?active= filter; accepts true/false/1/0.
    active: z
      .enum(['true', 'false', '1', '0'])
      .transform((v) => v === 'true' || v === '1')
      .optional(),
  }),
};

export const createServiceSchema = {
  body: z.object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(1000).optional(),
    price: priceSchema,
    durationMinutes: z.number().int().positive().max(24 * 60),
    isActive: z.boolean().optional(),
  }),
};

export const updateServiceSchema = {
  params: idParamSchema,
  body: z
    .object({
      name: z.string().trim().min(1).max(120),
      description: z.string().trim().max(1000).nullable(),
      price: priceSchema,
      durationMinutes: z.number().int().positive().max(24 * 60),
      isActive: z.boolean(),
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
};

export const serviceIdParamSchema = { params: idParamSchema };

export type CreateServiceInput = z.infer<typeof createServiceSchema.body>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema.body>;
export type ListServicesQuery = z.infer<typeof listServicesSchema.query>;
