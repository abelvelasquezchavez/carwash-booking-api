import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { healthRoutes } from './health.routes';
import { serviceRoutes } from './service.routes';
import { customerRoutes } from './customer.routes';
import { bookingRoutes } from './booking.routes';
import { availabilityRoutes } from './availability.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/services', serviceRoutes);
apiRouter.use('/customers', customerRoutes);
apiRouter.use('/bookings', bookingRoutes);
apiRouter.use('/availability', availabilityRoutes);
