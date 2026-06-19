import { PaymentStatus, Prisma } from '@prisma/client';
import { bookingRepository } from '../repositories/booking.repository';
import { paymentRepository } from '../repositories/payment.repository';
import { ConflictError, NotFoundError } from '../utils/AppError';
import { type BookingDTO, toBookingDTO } from './booking.service';
import type { MarkPaymentInput } from '../schemas/payment.schema';

export const paymentService = {
  /**
   * Records a payment for a booking and marks it PAID.
   *   - Booking must exist (404) and not be already paid (409).
   *   - `amount` defaults to the booking's frozen amount when omitted.
   *   - `paidAt` defaults to now when omitted.
   */
  async markAsPaid(
    bookingId: number,
    input: MarkPaymentInput,
  ): Promise<BookingDTO> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    if (booking.paymentStatus === PaymentStatus.PAID) {
      throw new ConflictError('Booking is already paid');
    }

    const amount =
      input.amount !== undefined
        ? new Prisma.Decimal(input.amount)
        : booking.amount;
    const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();

    const updated = await paymentRepository.register({
      bookingId,
      method: input.method,
      amount,
      paidAt,
      notes: input.notes ?? null,
    });

    return toBookingDTO(updated);
  },
};
