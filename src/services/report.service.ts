import { PaymentMethod, Prisma } from '@prisma/client';
import { reportRepository } from '../repositories/report.repository';
import type { RevenueQuery } from '../schemas/report.schema';

const MS_PER_DAY = 86_400_000;

export interface PendingItem {
  bookingId: number;
  startTime: string;
  amount: string;
  daysOld: number;
  customer: { id: number; name: string; phone: string };
  service: { id: number; name: string };
}

export interface PendingReport {
  data: PendingItem[];
  summary: { count: number; totalDue: string };
}

export interface RevenueReport {
  from: string;
  to: string;
  total: string;
  count: number;
  byMethod: Record<PaymentMethod, string>;
}

const emptyByMethod = (): Record<PaymentMethod, Prisma.Decimal> => ({
  [PaymentMethod.CASH]: new Prisma.Decimal(0),
  [PaymentMethod.TRANSFER]: new Prisma.Decimal(0),
  [PaymentMethod.YAPE]: new Prisma.Decimal(0),
  [PaymentMethod.PLIN]: new Prisma.Decimal(0),
  [PaymentMethod.CARD]: new Prisma.Decimal(0),
});

export const reportService = {
  /** Accounts receivable: unpaid bookings + the total amount owed. */
  async pending(now: number = Date.now()): Promise<PendingReport> {
    const bookings = await reportRepository.findPendingBookings();

    let totalDue = new Prisma.Decimal(0);
    const data: PendingItem[] = bookings.map((b) => {
      totalDue = totalDue.add(b.amount);
      const daysOld = Math.max(
        0,
        Math.floor((now - b.createdAt.getTime()) / MS_PER_DAY),
      );
      return {
        bookingId: b.id,
        startTime: b.startTime.toISOString(),
        amount: b.amount.toFixed(2),
        daysOld,
        customer: {
          id: b.customer.id,
          name: b.customer.name,
          phone: b.customer.phone,
        },
        service: { id: b.service.id, name: b.service.name },
      };
    });

    return {
      data,
      summary: { count: data.length, totalDue: totalDue.toFixed(2) },
    };
  },

  /** Collected revenue in [from, to], broken down by payment method. */
  async revenue(query: RevenueQuery): Promise<RevenueReport> {
    const from = new Date(`${query.from}T00:00:00.000Z`);
    // Make `to` inclusive of the whole day by using an exclusive upper bound
    // at the start of the following day.
    const toExclusive = new Date(
      new Date(`${query.to}T00:00:00.000Z`).getTime() + MS_PER_DAY,
    );

    const payments = await reportRepository.findPaymentsInRange(
      from,
      toExclusive,
    );

    const byMethod = emptyByMethod();
    let total = new Prisma.Decimal(0);
    for (const payment of payments) {
      total = total.add(payment.amount);
      byMethod[payment.method] = byMethod[payment.method].add(payment.amount);
    }

    return {
      from: query.from,
      to: query.to,
      total: total.toFixed(2),
      count: payments.length,
      byMethod: {
        [PaymentMethod.CASH]: byMethod.CASH.toFixed(2),
        [PaymentMethod.TRANSFER]: byMethod.TRANSFER.toFixed(2),
        [PaymentMethod.YAPE]: byMethod.YAPE.toFixed(2),
        [PaymentMethod.PLIN]: byMethod.PLIN.toFixed(2),
        [PaymentMethod.CARD]: byMethod.CARD.toFixed(2),
      },
    };
  },
};
