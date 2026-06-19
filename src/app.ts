import express, { type Application } from 'express';
import { apiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

/**
 * Builds the Express application. Kept free of `listen()` so tests can import
 * the app and drive it with Supertest without opening a real socket.
 */
export const createApp = (): Application => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/api', apiRouter);

  // Unmatched routes -> 404, then the centralized error handler.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app = createApp();
