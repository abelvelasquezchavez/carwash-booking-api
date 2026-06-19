import {
  BookingStatus,
  type Payment,
  PaymentStatus,
} from '@prisma/client';
import { prisma } from '../config/prisma';
import type { BookingWithRelations } from './booking.repository';

export const reportRepository = {
  /**
   * Outstanding receivables: unpaid bookings that were not cancelled, oldest
   * first. Cancelled bookings are never owed.
   */
  findPendingBookings(): Promise<BookingWithRelations[]> {
    return prisma.booking.findMany({
      where: {
        paymentStatus: PaymentStatus.UNPAID,
        status: { not: BookingStatus.CANCELLED },
      },
      orderBy: { createdAt: 'asc' },
      include: { service: true, customer: true, payment: true },
    });
  },

  /** Payments collected in the half-open range [from, to). */
  findPaymentsInRange(from: Date, to: Date): Promise<Payment[]> {
    return prisma.payment.findMany({
      where: { paidAt: { gte: from, lt: to } },
      orderBy: { paidAt: 'asc' },
    });
  },
};
