import type { Request, Response } from 'express';

export const healthController = {
  check(_req: Request, res: Response): void {
    res.status(200).json({
      data: {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    });
  },
};
