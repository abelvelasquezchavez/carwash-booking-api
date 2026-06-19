import { Router } from 'express';
import { serviceController } from '../controllers/service.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  createServiceSchema,
  listServicesSchema,
  serviceIdParamSchema,
  updateServiceSchema,
} from '../schemas/service.schema';

export const serviceRoutes = Router();

// Public catalogue.
serviceRoutes.get('/', validate(listServicesSchema), serviceController.list);
serviceRoutes.get(
  '/:id',
  validate(serviceIdParamSchema),
  serviceController.getById,
);

// Protected mutations.
serviceRoutes.post(
  '/',
  authenticate,
  validate(createServiceSchema),
  serviceController.create,
);
serviceRoutes.put(
  '/:id',
  authenticate,
  validate(updateServiceSchema),
  serviceController.update,
);
serviceRoutes.delete(
  '/:id',
  authenticate,
  validate(serviceIdParamSchema),
  serviceController.remove,
);
