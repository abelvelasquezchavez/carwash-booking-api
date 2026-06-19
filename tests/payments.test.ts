import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import { app } from '../src/app';
import { prismaMock } from './setup';
import {
  authHeader,
  makeBookingWithRelations,
  makePayment,
} from './helpers';

describe('PATCH /api/bookings/:id/payment', () => {
  it('records a payment: booking becomes PAID and a Payment is created', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(
      makeBookingWithRelations({ paymentStatus: 'UNPAID' }),
    );
    // The repository runs payment.create + booking.update inside a transaction.
    prismaMock.$transaction.mockResolvedValue([
      makePayment({ method: 'CASH' }),
      makeBookingWithRelations({
        paymentStatus: 'PAID',
        payment: makePayment({ method: 'CASH' }),
      }),
    ]);

    const res = await request(app)
      .patch('/api/bookings/1/payment')
      .set('Authorization', authHeader())
      .send({ method: 'CASH' });

    expect(res.status).toBe(200);
    expect(res.body.data.paymentStatus).toBe('PAID');
    expect(res.body.data.payment).toMatchObject({
      method: 'CASH',
      amount: '25.00',
    });

    // A Payment row is created, defaulting to the booking's frozen amount.
    expect(prismaMock.payment.create).toHaveBeenCalledTimes(1);
    const createArg = prismaMock.payment.create.mock.calls[0]?.[0];
    expect(createArg?.data.amount).toEqual(new Prisma.Decimal('25.00'));
  });

  it('returns 409 when the booking is already paid', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(
      makeBookingWithRelations({
        paymentStatus: 'PAID',
        payment: makePayment(),
      }),
    );

    const res = await request(app)
      .patch('/api/bookings/1/payment')
      .set('Authorization', authHeader())
      .send({ method: 'CASH' });

    expect(res.status).toBe(409);
    expect(res.body.status).toBe('error');
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('rejects an unknown payment method with 400', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(
      makeBookingWithRelations({ paymentStatus: 'UNPAID' }),
    );

    const res = await request(app)
      .patch('/api/bookings/1/payment')
      .set('Authorization', authHeader())
      .send({ method: 'BITCOIN' });

    expect(res.status).toBe(400);
  });

  it('requires authentication', async () => {
    const res = await request(app)
      .patch('/api/bookings/1/payment')
      .send({ method: 'CASH' });

    expect(res.status).toBe(401);
    expect(prismaMock.booking.findUnique).not.toHaveBeenCalled();
  });
});
