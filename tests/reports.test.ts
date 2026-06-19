import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import { app } from '../src/app';
import { prismaMock } from './setup';
import { authHeader, makeBookingWithRelations, makePayment } from './helpers';

describe('GET /api/reports/pending', () => {
  it('lists only unpaid bookings and totals the amount owed', async () => {
    prismaMock.booking.findMany.mockResolvedValue([
      makeBookingWithRelations({
        id: 1,
        paymentStatus: 'UNPAID',
        amount: new Prisma.Decimal('25.00'),
      }),
      makeBookingWithRelations({
        id: 2,
        paymentStatus: 'UNPAID',
        amount: new Prisma.Decimal('40.50'),
      }),
    ]);

    const res = await request(app)
      .get('/api/reports/pending')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.summary).toEqual({ count: 2, totalDue: '65.50' });
    expect(typeof res.body.data[0].daysOld).toBe('number');

    // The query filters to unpaid, non-cancelled bookings only.
    expect(prismaMock.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ paymentStatus: 'UNPAID' }),
      }),
    );
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/reports/pending');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/reports/revenue', () => {
  it('sums collected revenue and breaks it down by method', async () => {
    prismaMock.payment.findMany.mockResolvedValue([
      makePayment({ id: 1, method: 'CASH', amount: new Prisma.Decimal('25.00') }),
      makePayment({ id: 2, method: 'YAPE', amount: new Prisma.Decimal('40.00') }),
      makePayment({ id: 3, method: 'CASH', amount: new Prisma.Decimal('10.00') }),
    ]);

    const res = await request(app)
      .get('/api/reports/revenue?from=2026-06-01&to=2026-06-30')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe('75.00');
    expect(res.body.data.count).toBe(3);
    expect(res.body.data.byMethod).toMatchObject({
      CASH: '35.00',
      YAPE: '40.00',
      CARD: '0.00',
    });
  });

  it('rejects an inverted date range with 400', async () => {
    const res = await request(app)
      .get('/api/reports/revenue?from=2026-06-30&to=2026-06-01')
      .set('Authorization', authHeader());

    expect(res.status).toBe(400);
  });
});
