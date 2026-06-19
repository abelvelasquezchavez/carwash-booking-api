import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { customerService } from '../services/customer.service';
import type { PaginationQuery } from '../schemas/common.schema';

export const customerController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as PaginationQuery;
    const result = await customerService.list({ page, limit });
    res.status(200).json(result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = await customerService.getById(id);
    res.status(200).json({ data });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await customerService.create(req.body);
    res.status(201).json({ data });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = await customerService.update(id, req.body);
    res.status(200).json({ data });
  }),
};
