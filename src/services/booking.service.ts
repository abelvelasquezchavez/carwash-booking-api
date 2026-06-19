import {
  BookingStatus,
  type PaymentMethod,
  type PaymentStatus,
  type Prisma,
} from '@prisma/client';
import {
  type BookingWithRelations,
  bookingRepository,
} from '../repositories/booking.repository';
import { serviceRepository } from '../repositories/service.repository';
import { customerRepository } from '../repositories/customer.repository';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../utils/AppError';
import {
  buildPaginationMeta,
  type PaginationMeta,
  type PaginationParams,
  toSkipTake,
} from '../utils/pagination';
import type {
  CreateBookingInput,
  ListBookingsQuery,
} from '../schemas/booking.schema';

export interface BookingDTO {
  id: number;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes: string | null;
  paymentStatus: PaymentStatus;
  amount: string;
  service: { id: number; name: string; durationMinutes: number; price: string };
  customer: { id: number; name: string; phone: string };
  payment: {
    id: number;
    method: PaymentMethod;
    amount: string;
    paidAt: string;
    notes: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Allowed status transitions. Terminal states (COMPLETED, CANCELLED) have no
 * outgoing edges. Cancelling is permitted from any non-terminal state.
 */
const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED,
  ],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
};

/** Maps a booking (with its relations) to the public DTO. Shared with the payment service. */
export const toBookingDTO = (booking: BookingWithRelations): BookingDTO => ({
  id: booking.id,
  startTime: booking.startTime.toISOString(),
  endTime: booking.endTime.toISOString(),
  status: booking.status,
  notes: booking.notes,
  paymentStatus: booking.paymentStatus,
  amount: booking.amount.toFixed(2),
  service: {
    id: booking.service.id,
    name: booking.service.name,
    durationMinutes: booking.service.durationMinutes,
    price: booking.service.price.toFixed(2),
  },
  customer: {
    id: booking.customer.id,
    name: booking.customer.name,
    phone: booking.customer.phone,
  },
  payment: booking.payment
    ? {
        id: booking.payment.id,
        method: booking.payment.method,
        amount: booking.payment.amount.toFixed(2),
        paidAt: booking.payment.paidAt.toISOString(),
        notes: booking.payment.notes,
      }
    : null,
  createdAt: booking.createdAt.toISOString(),
  updatedAt: booking.updatedAt.toISOString(),
});

const toDTO = toBookingDTO;

const addMinutes = (date: Date, minutes: number): Date =>
  new Date(date.getTime() + minutes * 60_000);

export const bookingService = {
  async list(
    query: ListBookingsQuery,
  ): Promise<{ data: BookingDTO[]; pagination: PaginationMeta }> {
    const pagination: PaginationParams = {
      page: query.page,
      limit: query.limit,
    };

    const where: Prisma.BookingWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.date) {
      // [00:00, next 00:00) of the requested UTC day.
      const dayStart = new Date(`${query.date}T00:00:00.000Z`);
      const dayEnd = addMinutes(dayStart, 24 * 60);
      where.startTime = { gte: dayStart, lt: dayEnd };
    }

    const { rows, total } = await bookingRepository.listAndCount({
      ...toSkipTake(pagination),
      where,
    });

    return {
      data: rows.map(toDTO),
      pagination: buildPaginationMeta(pagination, total),
    };
  },

  async getById(id: number): Promise<BookingDTO> {
    const booking = await bookingRepository.findById(id);
    if (!booking) throw new NotFoundError('Booking not found');
    return toDTO(booking);
  },

  /**
   * Creates a booking enforcing the core business rules:
   *   1. The service must exist and be active.
   *   2. The customer must exist.
   *   3. startTime must be in the future.
   *   4. endTime is derived from the service duration (never client-supplied).
   *   5. No overlap with any non-cancelled booking (single provider).
   */
  async create(input: CreateBookingInput): Promise<BookingDTO> {
    const service = await serviceRepository.findById(input.serviceId);
    if (!service) throw new NotFoundError('Service not found');
    if (!service.isActive) {
      throw new BadRequestError('Cannot book an inactive service');
    }

    const customer = await customerRepository.findById(input.customerId);
    if (!customer) throw new NotFoundError('Customer not found');

    const startTime = new Date(input.startTime);
    if (startTime.getTime() <= Date.now()) {
      throw new BadRequestError('startTime must be in the future');
    }

    const endTime = addMinutes(startTime, service.durationMinutes);

    const overlap = await bookingRepository.findOverlapping({
      startTime,
      endTime,
    });
    if (overlap) {
      throw new ConflictError(
        'The requested time slot overlaps with an existing booking',
      );
    }

    const booking = await bookingRepository.create({
      startTime,
      endTime,
      notes: input.notes ?? null,
      // Freeze the price at booking time; it stays put if the catalogue changes.
      amount: service.price,
      service: { connect: { id: service.id } },
      customer: { connect: { id: customer.id } },
    });

    return toDTO(booking);
  },

  async updateStatus(
    id: number,
    nextStatus: BookingStatus,
  ): Promise<BookingDTO> {
    const booking = await bookingRepository.findById(id);
    if (!booking) throw new NotFoundError('Booking not found');

    const current = booking.status;
    if (current === nextStatus) {
      throw new BadRequestError(`Booking is already ${current}`);
    }

    const allowed = ALLOWED_TRANSITIONS[current];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestError(
        `Invalid status transition: ${current} -> ${nextStatus}`,
      );
    }

    const updated = await bookingRepository.updateStatus(id, nextStatus);
    return toDTO(updated);
  },
};
