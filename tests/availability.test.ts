import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { prismaMock } from './setup';
import { authHeader, makeBooking, makeService } from './helpers';

describe('GET /api/availability', () => {
  it('returns every open slot when there are no bookings', async () => {
    // 60-min service, business hours 08:00–18:00 -> 10 slots.
    prismaMock.service.findUnique.mockResolvedValue(
      makeService({ durationMinutes: 60 }),
    );
    prismaMock.booking.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/availability?date=2099-06-01&serviceId=1')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.slots).toHaveLength(10);
    expect(res.body.data.slots[0]).toEqual({
      startTime: '2099-06-01T08:00:00.000Z',
      endTime: '2099-06-01T09:00:00.000Z',
    });
    expect(res.body.data.businessHours).toEqual({ open: 8, close: 18 });
  });

  it('excludes slots that overlap an existing booking', async () => {
    prismaMock.service.findUnique.mockResolvedValue(
      makeService({ durationMinutes: 60 }),
    );
    // A booking from 10:00 to 11:00 should remove exactly that slot.
    prismaMock.booking.findMany.mockResolvedValue([
      makeBooking({
        startTime: new Date('2099-06-01T10:00:00.000Z'),
        endTime: new Date('2099-06-01T11:00:00.000Z'),
      }),
    ]);

    const res = await request(app)
      .get('/api/availability?date=2099-06-01&serviceId=1')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.slots).toHaveLength(9);
    const starts = res.body.data.slots.map(
      (s: { startTime: string }) => s.startTime,
    );
    expect(starts).not.toContain('2099-06-01T10:00:00.000Z');
  });

  it('requires authentication', async () => {
    const res = await request(app).get(
      '/api/availability?date=2099-06-01&serviceId=1',
    );
    expect(res.status).toBe(401);
  });
});
