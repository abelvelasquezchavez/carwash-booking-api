import { Router } from 'express';
import { availabilityController } from '../controllers/availability.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { availabilitySchema } from '../schemas/availability.schema';

export const availabilityRoutes = Router();

availabilityRoutes.get(
  '/',
  authenticate,
  validate(availabilitySchema),
  availabilityController.getSlots,
);
