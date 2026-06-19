import { PrismaClient } from '@prisma/client';

/**
 * Singleton PrismaClient. A single instance is reused across the app so we do
 * not exhaust the database connection pool. In development we also cache it on
 * `globalThis` to survive hot-reloads (tsx watch).
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
