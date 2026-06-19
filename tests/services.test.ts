import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { prismaMock } from './setup';
import { authHeader, makeService } from './helpers';

describe('Services', () => {
  describe('GET /api/services (public catalogue)', () => {
    it('returns the list of services in a data envelope', async () => {
      prismaMock.service.findMany.mockResolvedValue([
        makeService({ id: 1, name: 'Basic Wash' }),
        makeService({ id: 2, name: 'Wax & Polish', durationMinutes: 90 }),
      ]);

      const res = await request(app).get('/api/services');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toMatchObject({
        id: 1,
        name: 'Basic Wash',
        price: '25.00',
      });
    });

    it('filters by ?active=true', async () => {
      prismaMock.service.findMany.mockResolvedValue([makeService()]);

      const res = await request(app).get('/api/services?active=true');

      expect(res.status).toBe(200);
      expect(prismaMock.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
    });
  });

  describe('POST /api/services (protected)', () => {
    it('creates a service when authenticated', async () => {
      prismaMock.service.create.mockResolvedValue(
        makeService({ name: 'Interior Detail', durationMinutes: 120 }),
      );

      const res = await request(app)
        .post('/api/services')
        .set('Authorization', authHeader())
        .send({ name: 'Interior Detail', price: 25, durationMinutes: 120 });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(1);
    });

    it('rejects writes without a token with 401', async () => {
      const res = await request(app)
        .post('/api/services')
        .send({ name: 'Interior Detail', price: 25, durationMinutes: 120 });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
      expect(prismaMock.service.create).not.toHaveBeenCalled();
    });
  });
});
