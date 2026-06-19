import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { serviceService } from '../services/service.service';
import type { ListServicesQuery } from '../schemas/service.schema';

export const serviceController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const data = await serviceService.list(
      req.query as unknown as ListServicesQuery,
    );
    res.status(200).json({ data });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = await serviceService.getById(id);
    res.status(200).json({ data });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await serviceService.create(req.body);
    res.status(201).json({ data });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = await serviceService.update(id, req.body);
    res.status(200).json({ data });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await serviceService.remove(id);
    res.status(204).send();
  }),
};
