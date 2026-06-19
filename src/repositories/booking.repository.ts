import {
  type Booking,
  BookingStatus,
  type Prisma,
} from '@prisma/client';
import { prisma } from '../config/prisma';

/** A booking joined with the data needed to build a rich DTO. */
export type BookingWithRelations = Prisma.BookingGetPayload<{
  include: { service: true; customer: true };
}>;

const includeRelations = { service: true, customer: true } as const;

export const bookingRepository = {
  async listAndCount(args: {
    skip: number;
    take: number;
    where: Prisma.BookingWhereInput;
  }): Promise<{ rows: BookingWithRelations[]; total: number }> {
    const [rows, total] = await Promise.all([
      prisma.booking.findMany({
        where: args.where,
        skip: args.skip,
        take: args.take,
        orderBy: { startTime: 'asc' },
        include: includeRelations,
      }),
      prisma.booking.count({ where: args.where }),
    ]);
    return { rows, total };
  },

  findById(id: number): Promise<BookingWithRelations | null> {
    return prisma.booking.findUnique({
      where: { id },
      include: includeRelations,
    });
  },

  create(data: Prisma.BookingCreateInput): Promise<BookingWithRelations> {
    return prisma.booking.create({ data, include: includeRelations });
  },

  updateStatus(
    id: number,
    status: BookingStatus,
  ): Promise<BookingWithRelations> {
    return prisma.booking.update({
      where: { id },
      data: { status },
      include: includeRelations,
    });
  },

  /**
   * Returns the first active (non-cancelled) booking overlapping the half-open
   * interval [startTime, endTime). Two intervals overlap when
   * aStart < bEnd && bStart < aEnd. An optional `excludeId` skips a booking
   * (useful when rescheduling).
   */
  findOverlapping(args: {
    startTime: Date;
    endTime: Date;
    excludeId?: number;
  }): Promise<Booking | null> {
    const where: Prisma.BookingWhereInput = {
      status: { not: BookingStatus.CANCELLED },
      startTime: { lt: args.endTime },
      endTime: { gt: args.startTime },
    };
    if (args.excludeId !== undefined) {
      where.id = { not: args.excludeId };
    }
    return prisma.booking.findFirst({ where });
  },

  /** Active bookings whose start falls within [from, to). Used by availability. */
  findActiveInRange(from: Date, to: Date): Promise<Booking[]> {
    return prisma.booking.findMany({
      where: {
        status: { not: BookingStatus.CANCELLED },
        startTime: { gte: from, lt: to },
      },
      orderBy: { startTime: 'asc' },
    });
  },
};
