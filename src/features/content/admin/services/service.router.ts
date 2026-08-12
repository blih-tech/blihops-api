import { Router } from 'express';

import { validate } from '../../../../shared/middlewares/validate.js';
import {
  createServiceBodySchema,
  patchServiceBodySchema,
  serviceIdParamsSchema,
} from './service.schema.js';
import {
  createServiceController,
  deleteServiceController,
  getAdminServiceController,
  getAdminServicesController,
  updateServiceController,
} from './service.controller.js';

export const adminServiceRouter = Router();

adminServiceRouter.get('/', getAdminServicesController);

adminServiceRouter.get(
  '/:id',
  validate('params', serviceIdParamsSchema),
  getAdminServiceController,
);

adminServiceRouter.post(
  '/',
  validate('body', createServiceBodySchema),
  createServiceController,
);

adminServiceRouter.patch(
  '/:id',
  validate('params', serviceIdParamsSchema),
  validate('body', patchServiceBodySchema),
  updateServiceController,
);

adminServiceRouter.delete(
  '/:id',
  validate('params', serviceIdParamsSchema),
  deleteServiceController,
);
