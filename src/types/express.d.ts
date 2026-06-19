import type { JwtPayload } from '../utils/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Populated by the `authenticate` middleware after a valid JWT. */
      user?: JwtPayload;
    }
  }
}

export {};
