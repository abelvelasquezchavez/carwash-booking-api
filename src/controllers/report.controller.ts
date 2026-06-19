import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { reportService } from '../services/report.service';
import type { RevenueQuery } from '../schemas/report.schema';

export const reportController = {
  pending: asyncHandler(async (_req: Request, res: Response) => {
    const result = await reportService.pending();
    res.status(200).json(result);
  }),

  revenue: asyncHandler(async (req: Request, res: Response) => {
    const data = await reportService.revenue(
      req.query as unknown as RevenueQuery,
    );
    res.status(200).json({ data });
  }),
};
