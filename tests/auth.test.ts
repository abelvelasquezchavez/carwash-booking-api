import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { prismaMock } from './setup';
import { makeService } from './helpers';

describe('Auth', () => {
  it('POST /api/auth/register creates a user and returns a token', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 1,
      email: 'abuelo@carwash.test',
      password: 'hashed',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'abuelo@carwash.test', password: 'supersecret' });

    expect(res.status).toBe(201);
    expect(typeof res.body.data.token).toBe('string');
    expect(res.body.data.user).toEqual({ id: 1, email: 'abuelo@carwash.test' });
  });

  it('POST /api/auth/register rejects a short password with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'abuelo@carwash.test', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.errors).toBeDefined();
  });

  it('rejects protected writes without a token with 401', async () => {
    const res = await request(app)
      .post('/api/customers')
      .send({ name: 'X', phone: '12345', address: 'Somewhere' });

    expect(res.status).toBe(401);
    // Auth runs before any DB access.
    expect(prismaMock.customer.create).not.toHaveBeenCalled();
  });

  it('does not leak service data without auth on protected create', async () => {
    prismaMock.service.create.mockResolvedValue(makeService());
    const res = await request(app).post('/api/services').send({});
    expect(res.status).toBe(401);
  });
});
