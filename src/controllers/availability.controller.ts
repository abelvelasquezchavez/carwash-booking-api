import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { availabilityService } from '../services/availability.service';
import type { AvailabilityQuery } from '../schemas/availability.schema';

export const availabilityController = {
  getSlots: asyncHandler(async (req: Request, res: Response) => {
    const data = await availabilityService.getSlots(
      req.query as unknown as AvailabilityQuery,
    );
    res.status(200).json({ data });
  }),
};
