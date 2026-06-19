import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { bookingService } from '../services/booking.service';
import type { ListBookingsQuery } from '../schemas/booking.schema';

export const bookingController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await bookingService.list(
      req.query as unknown as ListBookingsQuery,
    );
    res.status(200).json(result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = await bookingService.getById(id);
    res.status(200).json({ data });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await bookingService.create(req.body);
    res.status(201).json({ data });
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = await bookingService.updateStatus(id, req.body.status);
    res.status(200).json({ data });
  }),
};
