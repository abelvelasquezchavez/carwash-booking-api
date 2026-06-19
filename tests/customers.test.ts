import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { prismaMock } from './setup';
import { authHeader, makeCustomer } from './helpers';

describe('GET /api/customers (paginated, protected)', () => {
  it('returns a paginated envelope with data + pagination', async () => {
    prismaMock.customer.findMany.mockResolvedValue([
      makeCustomer({ id: 1 }),
      makeCustomer({ id: 2, name: 'Don Pepe' }),
    ]);
    prismaMock.customer.count.mockResolvedValue(25);

    const res = await request(app)
      .get('/api/customers?page=2&limit=10')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
    // page 2, limit 10 -> skip 10, take 10
    expect(prismaMock.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/customers');
    expect(res.status).toBe(401);
  });
});
