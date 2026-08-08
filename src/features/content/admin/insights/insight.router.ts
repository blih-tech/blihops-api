import { Router } from 'express';

import { validate } from '../../../../shared/middlewares/validate.js';
import {
  adminInsightListQuerySchema,
  createInsightBodySchema,
  insightIdParamsSchema,
  patchInsightBodySchema,
} from './insight.schema.js';
import {
  createInsightController,
  deleteInsightController,
  getAdminInsightController,
  getAdminInsightsController,
  publishInsightController,
  unpublishInsightController,
  updateInsightController,
} from './insight.controller.js';

export const adminInsightRouter = Router();

adminInsightRouter.get(
  '/',
  validate('query', adminInsightListQuerySchema),
  getAdminInsightsController,
);

adminInsightRouter.get(
  '/:id',
  validate('params', insightIdParamsSchema),
  getAdminInsightController,
);

adminInsightRouter.post(
  '/',
  validate('body', createInsightBodySchema),
  createInsightController,
);

adminInsightRouter.patch(
  '/:id',
  validate('params', insightIdParamsSchema),
  validate('body', patchInsightBodySchema),
  updateInsightController,
);

adminInsightRouter.post(
  '/:id/publish',
  validate('params', insightIdParamsSchema),
  publishInsightController,
);

adminInsightRouter.post(
  '/:id/unpublish',
  validate('params', insightIdParamsSchema),
  unpublishInsightController,
);

adminInsightRouter.delete(
  '/:id',
  validate('params', insightIdParamsSchema),
  deleteInsightController,
);
