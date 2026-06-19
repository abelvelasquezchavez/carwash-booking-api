import { z } from 'zod';
import { idParamSchema, paginationQuerySchema } from './common.schema';

export const listCustomersSchema = {
  query: paginationQuerySchema,
};

export const createCustomerSchema = {
  body: z.object({
    name: z.string().trim().min(1).max(120),
    phone: z.string().trim().min(5).max(30),
    address: z.string().trim().min(1).max(255),
    zone: z.string().trim().max(120).optional(),
  }),
};

export const updateCustomerSchema = {
  params: idParamSchema,
  body: z
    .object({
      name: z.string().trim().min(1).max(120),
      phone: z.string().trim().min(5).max(30),
      address: z.string().trim().min(1).max(255),
      zone: z.string().trim().max(120).nullable(),
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
};

export const customerIdParamSchema = { params: idParamSchema };

export type CreateCustomerInput = z.infer<typeof createCustomerSchema.body>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema.body>;
