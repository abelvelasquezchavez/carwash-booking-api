import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  bookingIdParamSchema,
  createBookingSchema,
  listBookingsSchema,
  updateBookingStatusSchema,
} from '../schemas/booking.schema';

export const bookingRoutes = Router();

bookingRoutes.use(authenticate);

bookingRoutes.get('/', validate(listBookingsSchema), bookingController.list);
bookingRoutes.post('/', validate(createBookingSchema), bookingController.create);
bookingRoutes.get(
  '/:id',
  validate(bookingIdParamSchema),
  bookingController.getById,
);
bookingRoutes.patch(
  '/:id/status',
  validate(updateBookingStatusSchema),
  bookingController.updateStatus,
);
