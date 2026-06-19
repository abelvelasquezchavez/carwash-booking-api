import { type PaymentMethod, PaymentStatus, type Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { BookingWithRelations } from './booking.repository';

const includeRelations = {
  service: true,
  customer: true,
  payment: true,
} as const;

export const paymentRepository = {
  /**
   * Atomically records a payment and flips the booking to PAID. Both writes run
   * in a single transaction so a booking is never marked paid without its
   * Payment row (and vice versa). The returned booking already includes the
   * freshly created payment.
   */
  async register(args: {
    bookingId: number;
    method: PaymentMethod;
    amount: Prisma.Decimal;
    paidAt: Date;
    notes: string | null;
  }): Promise<BookingWithRelations> {
    const [, booking] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          method: args.method,
          amount: args.amount,
          paidAt: args.paidAt,
          notes: args.notes,
          booking: { connect: { id: args.bookingId } },
        },
      }),
      prisma.booking.update({
        where: { id: args.bookingId },
        data: { paymentStatus: PaymentStatus.PAID },
        include: includeRelations,
      }),
    ]);
    return booking;
  },
};
