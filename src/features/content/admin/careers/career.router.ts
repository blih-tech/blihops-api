import { Router } from 'express';

import { validate } from '../../../../shared/middlewares/validate.js';
import {
  adminCareerListQuerySchema,
  careerIdParamsSchema,
  createCareerBodySchema,
  patchCareerBodySchema,
} from './career.schema.js';
import {
  createCareerController,
  deleteCareerController,
  getAdminCareerController,
  getAdminCareersController,
  updateCareerController,
} from './career.controller.js';

export const adminCareerRouter = Router();

adminCareerRouter.get(
  '/',
  validate('query', adminCareerListQuerySchema),
  getAdminCareersController,
);

adminCareerRouter.get(
  '/:id',
  validate('params', careerIdParamsSchema),
  getAdminCareerController,
);

adminCareerRouter.post(
  '/',
  validate('body', createCareerBodySchema),
  createCareerController,
);

adminCareerRouter.patch(
  '/:id',
  validate('params', careerIdParamsSchema),
  validate('body', patchCareerBodySchema),
  updateCareerController,
);

adminCareerRouter.delete(
  '/:id',
  validate('params', careerIdParamsSchema),
  deleteCareerController,
);
