import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

interface ErrorBody {
  status: 'error';
  message: string;
  errors?: { path: string; message: string }[];
}

/**
 * Centralized error handler. Maps known error shapes to HTTP responses with a
 * consistent envelope, and logs anything unexpected as a 500.
 *
 *   ZodError                 -> 400 (with field-level details)
 *   AppError (+ subclasses)  -> error.statusCode
 *   Prisma P2002 (unique)    -> 409
 *   Prisma P2025 (not found) -> 404
 *   everything else          -> 500 (logged)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ZodError) {
    const body: ErrorBody = {
      status: 'error',
      message: 'Validation failed',
      errors: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    };
    res.status(400).json(body);
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ status: 'error', message: err.message });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        status: 'error',
        message: 'A record with these unique fields already exists',
      });
      return;
    }
    if (err.code === 'P2025') {
      res
        .status(404)
        .json({ status: 'error', message: 'Resource not found' });
      return;
    }
  }

  // Unexpected: log it and return a generic 500.
  // eslint-disable-next-line no-console
  console.error('[unhandled error]', err);
  res
    .status(500)
    .json({ status: 'error', message: 'Internal server error' });
};

/** Fallback for unmatched routes. */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    status: 'error',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};
