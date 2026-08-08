import { Router } from 'express';

import { validate } from '../../../../shared/middlewares/validate.js';
import {
  createLogoBodySchema,
  deleteLogoParamsSchema,
  updateLogoBodySchema,
  updateLogoParamsSchema,
} from './logo.schema.js';
import {
  createLogoController,
  deleteLogoController,
  getAdminLogosController,
  updateLogoController,
} from './logo.controller.js';

export const adminLogoRouter = Router();

adminLogoRouter.get('/', getAdminLogosController);

adminLogoRouter.post(
  '/',
  validate('body', createLogoBodySchema),
  createLogoController,
);

adminLogoRouter.patch(
  '/:id',
  validate('params', updateLogoParamsSchema),
  validate('body', updateLogoBodySchema),
  updateLogoController,
);

adminLogoRouter.delete(
  '/:id',
  validate('params', deleteLogoParamsSchema),
  deleteLogoController,
);
