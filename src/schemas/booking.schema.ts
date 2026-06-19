import { z } from 'zod';
import { BookingStatus } from '@prisma/client';
import { idParamSchema, paginationQuerySchema } from './common.schema';

const isoDateTime = z
  .string()
  .datetime({ offset: true, message: 'startTime must be an ISO-8601 datetime' });

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format');

export const listBookingsSchema = {
  query: paginationQuerySchema.extend({
    date: dateOnly.optional(),
    status: z.nativeEnum(BookingStatus).optional(),
  }),
};

export const createBookingSchema = {
  body: z.object({
    serviceId: z.number().int().positive(),
    customerId: z.number().int().positive(),
    // endTime is derived from the service duration, never accepted from the client.
    startTime: isoDateTime,
    notes: z.string().trim().max(1000).optional(),
  }),
};

export const updateBookingStatusSchema = {
  params: idParamSchema,
  body: z.object({
    status: z.nativeEnum(BookingStatus),
  }),
};

export const bookingIdParamSchema = { params: idParamSchema };

export type ListBookingsQuery = z.infer<typeof listBookingsSchema.query>;
export type CreateBookingInput = z.infer<typeof createBookingSchema.body>;
export type UpdateBookingStatusInput = z.infer<
  typeof updateBookingStatusSchema.body
>;
