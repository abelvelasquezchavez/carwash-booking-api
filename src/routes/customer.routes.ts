import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  createCustomerSchema,
  customerIdParamSchema,
  listCustomersSchema,
  updateCustomerSchema,
} from '../schemas/customer.schema';

export const customerRoutes = Router();

// All customer data is private to the business -> fully protected.
customerRoutes.use(authenticate);

customerRoutes.get('/', validate(listCustomersSchema), customerController.list);
customerRoutes.post(
  '/',
  validate(createCustomerSchema),
  customerController.create,
);
customerRoutes.get(
  '/:id',
  validate(customerIdParamSchema),
  customerController.getById,
);
customerRoutes.put(
  '/:id',
  validate(updateCustomerSchema),
  customerController.update,
);
