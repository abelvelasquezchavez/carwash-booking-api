import type { Booking } from '@prisma/client';
import { bookingRepository } from '../repositories/booking.repository';
import { serviceRepository } from '../repositories/service.repository';
import { BadRequestError, NotFoundError } from '../utils/AppError';
import { env } from '../config/env';
import type { AvailabilityQuery } from '../schemas/availability.schema';

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
}

export interface AvailabilityResult {
  date: string;
  serviceId: number;
  durationMinutes: number;
  businessHours: { open: number; close: number };
  slots: AvailabilitySlot[];
}

const MS_PER_MINUTE = 60_000;

const overlaps = (
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean => aStart < bEnd && bStart < aEnd;

export const availabilityService = {
  /**
   * Builds the free slots for a given day and service. Slots are generated from
   * BUSINESS_OPEN to BUSINESS_CLOSE in steps of the service duration, then any
   * slot crossing an existing non-cancelled booking (or already in the past)
   * is dropped. All times are computed in UTC for deterministic behaviour.
   */
  async getSlots(query: AvailabilityQuery): Promise<AvailabilityResult> {
    const service = await serviceRepository.findById(query.serviceId);
    if (!service) throw new NotFoundError('Service not found');
    if (!service.isActive) {
      throw new BadRequestError('Cannot compute availability for an inactive service');
    }

    const duration = service.durationMinutes;
    const dayStart = new Date(`${query.date}T00:00:00.000Z`);
    if (Number.isNaN(dayStart.getTime())) {
      throw new BadRequestError('Invalid date');
    }

    const open = new Date(dayStart.getTime() + env.BUSINESS_OPEN * 60 * MS_PER_MINUTE);
    const close = new Date(dayStart.getTime() + env.BUSINESS_CLOSE * 60 * MS_PER_MINUTE);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * MS_PER_MINUTE);

    const bookings: Booking[] = await bookingRepository.findActiveInRange(
      open,
      dayEnd,
    );
    const busy = bookings.map((b) => ({
      start: b.startTime.getTime(),
      end: b.endTime.getTime(),
    }));

    const now = Date.now();
    const slots: AvailabilitySlot[] = [];

    for (
      let slotStart = open.getTime();
      slotStart + duration * MS_PER_MINUTE <= close.getTime();
      slotStart += duration * MS_PER_MINUTE
    ) {
      const slotEnd = slotStart + duration * MS_PER_MINUTE;

      // Skip slots that already started (only relevant when date is today).
      if (slotStart <= now) continue;

      const isBusy = busy.some((b) => overlaps(slotStart, slotEnd, b.start, b.end));
      if (isBusy) continue;

      slots.push({
        startTime: new Date(slotStart).toISOString(),
        endTime: new Date(slotEnd).toISOString(),
      });
    }

    return {
      date: query.date,
      serviceId: service.id,
      durationMinutes: duration,
      businessHours: { open: env.BUSINESS_OPEN, close: env.BUSINESS_CLOSE },
      slots,
    };
  },
};
