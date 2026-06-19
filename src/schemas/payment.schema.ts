import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';
import { idParamSchema } from './common.schema';

export const markPaymentSchema = {
  params: idParamSchema,
  body: z.object({
    method: z.nativeEnum(PaymentMethod),
    // Optional: defaults to the booking's frozen amount when omitted.
    amount: z
      .number()
      .positive('amount must be greater than 0')
      .max(99999999.99, 'amount exceeds the allowed maximum')
      .optional(),
    // Optional: defaults to "now" when omitted.
    paidAt: z
      .string()
      .datetime({ offset: true, message: 'paidAt must be an ISO-8601 datetime' })
      .optional(),
    notes: z.string().trim().max(1000).optional(),
  }),
};

export type MarkPaymentInput = z.infer<typeof markPaymentSchema.body>;
