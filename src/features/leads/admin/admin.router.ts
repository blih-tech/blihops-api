import { Router } from 'express';

import { requireAuth, requireRole } from '../../../shared/middlewares/auth.js';
import { validate } from '../../../shared/middlewares/validate.js';
import {
  leadIdParamsSchema,
  leadListQuerySchema,
  patchLeadStatusBodySchema,
} from '../schema.js';
import {
  deleteLeadController,
  getLeadController,
  listLeadsController,
  updateLeadStatusController,
} from './admin.controller.js';

export const adminLeadsRouter = Router();

adminLeadsRouter.use(requireAuth, requireRole('admin'));

adminLeadsRouter.get(
  '/',
  validate('query', leadListQuerySchema),
  listLeadsController,
);

adminLeadsRouter.get(
  '/:id',
  validate('params', leadIdParamsSchema),
  getLeadController,
);

adminLeadsRouter.patch(
  '/:id',
  validate('params', leadIdParamsSchema),
  validate('body', patchLeadStatusBodySchema),
  updateLeadStatusController,
);

adminLeadsRouter.delete(
  '/:id',
  validate('params', leadIdParamsSchema),
  deleteLeadController,
);
