import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { prismaMock } from './setup';
import {
  authHeader,
  makeBooking,
  makeBookingWithRelations,
  makeCustomer,
  makeService,
} from './helpers';

const FUTURE = '2099-06-01T10:00:00.000Z';
const PAST = '2020-01-01T10:00:00.000Z';

describe('POST /api/bookings', () => {
  it('creates a booking and derives endTime from the service duration', async () => {
    prismaMock.service.findUnique.mockResolvedValue(
      makeService({ durationMinutes: 60 }),
    );
    prismaMock.customer.findUnique.mockResolvedValue(makeCustomer());
    prismaMock.booking.findFirst.mockResolvedValue(null); // no overlap
    prismaMock.booking.create.mockResolvedValue(
      makeBookingWithRelations({
        startTime: new Date(FUTURE),
        endTime: new Date('2099-06-01T11:00:00.000Z'),
      }),
    );

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', authHeader())
      .send({ serviceId: 1, customerId: 1, startTime: FUTURE });

    expect(res.status).toBe(201);
    expect(res.body.data.startTime).toBe('2099-06-01T10:00:00.000Z');
    expect(res.body.data.endTime).toBe('2099-06-01T11:00:00.000Z');

    // endTime is computed server-side as start + 60min, never from the client.
    const createArg = prismaMock.booking.create.mock.calls[0]?.[0];
    expect(createArg?.data.endTime).toEqual(
      new Date('2099-06-01T11:00:00.000Z'),
    );
  });

  it('rejects an overlapping booking with 409 (no overbooking)', async () => {
    prismaMock.service.findUnique.mockResolvedValue(makeService());
    prismaMock.customer.findUnique.mockResolvedValue(makeCustomer());
    // An existing active booking collides with the requested window.
    prismaMock.booking.findFirst.mockResolvedValue(makeBooking());

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', authHeader())
      .send({ serviceId: 1, customerId: 1, startTime: FUTURE });

    expect(res.status).toBe(409);
    expect(res.body.status).toBe('error');
    expect(prismaMock.booking.create).not.toHaveBeenCalled();
  });

  it('rejects a booking in the past with 400', async () => {
    prismaMock.service.findUnique.mockResolvedValue(makeService());
    prismaMock.customer.findUnique.mockResolvedValue(makeCustomer());

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', authHeader())
      .send({ serviceId: 1, customerId: 1, startTime: PAST });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/future/i);
    expect(prismaMock.booking.create).not.toHaveBeenCalled();
  });

  it('rejects booking an inactive service with 400', async () => {
    prismaMock.service.findUnique.mockResolvedValue(
      makeService({ isActive: false }),
    );

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', authHeader())
      .send({ serviceId: 1, customerId: 1, startTime: FUTURE });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/inactive/i);
    expect(prismaMock.booking.create).not.toHaveBeenCalled();
  });

  it('requires authentication (401 without token)', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({ serviceId: 1, customerId: 1, startTime: FUTURE });

    expect(res.status).toBe(401);
    expect(prismaMock.service.findUnique).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/bookings/:id/status', () => {
  it('allows PENDING -> CONFIRMED', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(
      makeBookingWithRelations({ status: 'PENDING' }),
    );
    prismaMock.booking.update.mockResolvedValue(
      makeBookingWithRelations({ status: 'CONFIRMED' }),
    );

    const res = await request(app)
      .patch('/api/bookings/1/status')
      .set('Authorization', authHeader())
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');
  });

  it('rejects an invalid transition COMPLETED -> PENDING with 400', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(
      makeBookingWithRelations({ status: 'COMPLETED' }),
    );

    const res = await request(app)
      .patch('/api/bookings/1/status')
      .set('Authorization', authHeader())
      .send({ status: 'PENDING' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid status transition/i);
    expect(prismaMock.booking.update).not.toHaveBeenCalled();
  });
});
