import { Router } from 'express';

import { requireAuth, requireRole } from '../../../shared/middlewares/auth.js';
import { validate } from '../../../shared/middlewares/validate.js';
import {
  createTalentApplicationController,
  getTalentApplicationController,
  listTalentApplicationsController,
  patchTalentApplicationNotesController,
  patchTalentApplicationStatusController,
} from './application.controller.js';
import {
  createTalentApplicationBodySchema,
  patchTalentApplicationNotesBodySchema,
  patchTalentApplicationStatusBodySchema,
  talentApplicationIdParamsSchema,
  talentApplicationListQuerySchema,
} from './application.schema.js';

export const publicTalentApplicationsRouter = Router();

publicTalentApplicationsRouter.post(
  '/',
  validate('body', createTalentApplicationBodySchema),
  createTalentApplicationController,
);

export const adminTalentApplicationsRouter = Router();

adminTalentApplicationsRouter.use(requireAuth, requireRole('admin'));

adminTalentApplicationsRouter.get(
  '/',
  validate('query', talentApplicationListQuerySchema),
  listTalentApplicationsController,
);

adminTalentApplicationsRouter.get(
  '/:id',
  validate('params', talentApplicationIdParamsSchema),
  getTalentApplicationController,
);

adminTalentApplicationsRouter.patch(
  '/:id/status',
  validate('params', talentApplicationIdParamsSchema),
  validate('body', patchTalentApplicationStatusBodySchema),
  patchTalentApplicationStatusController,
);

adminTalentApplicationsRouter.patch(
  '/:id/notes',
  validate('params', talentApplicationIdParamsSchema),
  validate('body', patchTalentApplicationNotesBodySchema),
  patchTalentApplicationNotesController,
);
