import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { revenueSchema } from '../schemas/report.schema';

export const reportRoutes = Router();

// Business reports are private -> fully protected.
reportRoutes.use(authenticate);

reportRoutes.get('/pending', reportController.pending);
reportRoutes.get('/revenue', validate(revenueSchema), reportController.revenue);
