import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../utils/AppError';
import { verifyToken } from '../utils/jwt';

/**
 * Requires a valid `Authorization: Bearer <token>` header. On success the
 * decoded payload is attached to `req.user`; otherwise a 401 is raised.
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw new UnauthorizedError('Missing bearer token');
  }

  req.user = verifyToken(token);
  next();
};
