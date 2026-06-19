import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';

export interface RequestSchemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

/**
 * Mutates a target object in place so coerced values replace the originals
 * without breaking the object reference. Express 5 exposes `req.query` /
 * `req.params` via getters that cannot be reassigned, so we patch keys instead
 * of doing `req.query = parsed`.
 */
const mutateInPlace = (
  target: Record<string, unknown>,
  parsed: Record<string, unknown>,
): void => {
  for (const key of Object.keys(target)) {
    if (!(key in parsed)) delete target[key];
  }
  for (const [key, value] of Object.entries(parsed)) {
    target[key] = value;
  }
};

/**
 * Validates `body`, `params` and `query` against the provided Zod schemas and
 * writes the parsed (coerced) values back onto the request. A failed validation
 * is forwarded to the centralized error handler as a ZodError → HTTP 400.
 */
export const validate = (schemas: RequestSchemas): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params) as Record<string, unknown>;
        mutateInPlace(req.params as unknown as Record<string, unknown>, parsed);
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query) as Record<string, unknown>;
        mutateInPlace(req.query as unknown as Record<string, unknown>, parsed);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
        return;
      }
      next(error);
    }
  };
};
