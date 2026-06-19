import type { Server } from 'node:http';
import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

const server: Server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `🚿 Car Wash Booking API listening on port ${env.PORT} (${env.NODE_ENV})`,
  );
});

/**
 * Graceful shutdown: stop accepting new connections, then close the Prisma
 * connection pool before exiting. Triggered by SIGTERM (orchestrators) and
 * SIGINT (Ctrl-C).
 */
const shutdown = async (signal: string): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received, shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    // eslint-disable-next-line no-console
    console.log('Closed HTTP server and database connection. Bye 👋');
    process.exit(0);
  });

  // Force-exit if cleanup hangs.
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
