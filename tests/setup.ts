import type { PrismaClient } from '@prisma/client';
import { beforeEach, vi } from 'vitest';
import {
  type DeepMockProxy,
  mockDeep,
  mockReset,
} from 'vitest-mock-extended';
import { prisma } from '../src/config/prisma';

/**
 * Replace the Prisma singleton with a deep mock. Both the named and default
 * exports point to the SAME instance so repositories (which import the named
 * `prisma`) and any default import share one mock. The factory is evaluated
 * lazily, so referencing the hoisted `mockDeep` import is safe.
 */
vi.mock('../src/config/prisma', () => {
  const client = mockDeep<PrismaClient>();
  return { __esModule: true, default: client, prisma: client };
});

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});
