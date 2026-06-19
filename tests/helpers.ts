import {
  type Booking,
  BookingStatus,
  type Customer,
  type Payment,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  type Service,
} from '@prisma/client';
import { signToken } from '../src/utils/jwt';
import type { BookingWithRelations } from '../src/repositories/booking.repository';

const EPOCH = new Date('2026-01-01T00:00:00.000Z');

/** A valid Bearer header for protected routes. */
export const authHeader = (): string =>
  `Bearer ${signToken({ sub: 1, email: 'abuelo@carwash.test' })}`;

export const makeService = (overrides: Partial<Service> = {}): Service => ({
  id: 1,
  name: 'Basic Wash',
  description: 'Exterior hand wash',
  price: new Prisma.Decimal('25.00'),
  durationMinutes: 60,
  isActive: true,
  createdAt: EPOCH,
  updatedAt: EPOCH,
  ...overrides,
});

export const makeCustomer = (overrides: Partial<Customer> = {}): Customer => ({
  id: 1,
  name: 'Doña Rosa',
  phone: '+51 999 888 777',
  address: 'Av. Siempreviva 742',
  zone: 'Centro',
  createdAt: EPOCH,
  updatedAt: EPOCH,
  ...overrides,
});

export const makeBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: 1,
  startTime: new Date('2099-06-01T10:00:00.000Z'),
  endTime: new Date('2099-06-01T11:00:00.000Z'),
  status: BookingStatus.PENDING,
  notes: null,
  paymentStatus: PaymentStatus.UNPAID,
  amount: new Prisma.Decimal('25.00'),
  serviceId: 1,
  customerId: 1,
  createdAt: EPOCH,
  updatedAt: EPOCH,
  ...overrides,
});

export const makePayment = (overrides: Partial<Payment> = {}): Payment => ({
  id: 1,
  bookingId: 1,
  method: PaymentMethod.CASH,
  amount: new Prisma.Decimal('25.00'),
  paidAt: new Date('2026-06-19T12:00:00.000Z'),
  notes: null,
  createdAt: EPOCH,
  ...overrides,
});

export const makeBookingWithRelations = (
  overrides: Partial<BookingWithRelations> = {},
): BookingWithRelations => {
  const base = makeBooking(overrides as Partial<Booking>);
  return {
    ...base,
    service: makeService(),
    customer: makeCustomer(),
    payment: null,
    ...overrides,
  };
};
