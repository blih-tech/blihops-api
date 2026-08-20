import { Router } from 'express';

import { requireAuth, requireRole } from '../../../shared/middlewares/auth.js';
import { validate } from '../../../shared/middlewares/validate.js';
import {
  createTalentProfileController,
  deactivateTalentController,
  getTalentProfileController,
  hideTalentProfileController,
  listTalentProfilesController,
  reactivateTalentController,
  resendTalentInvitationController,
  showTalentProfileController,
  updateTalentProfileController,
} from './profile.controller.js';
import {
  createTalentProfileBodySchema,
  talentProfileIdParamsSchema,
  talentProfileListQuerySchema,
  updateTalentProfileBodySchema,
} from './profile.schema.js';
import { talentApplicationIdParamsSchema } from '../applications/application.schema.js';

export const adminTalentProfilesRouter = Router();
adminTalentProfilesRouter.use(requireAuth, requireRole('admin'));

adminTalentProfilesRouter.get(
  '/',
  validate('query', talentProfileListQuerySchema),
  listTalentProfilesController,
);
adminTalentProfilesRouter.get(
  '/:id',
  validate('params', talentProfileIdParamsSchema),
  getTalentProfileController,
);
adminTalentProfilesRouter.patch(
  '/:id',
  validate('params', talentProfileIdParamsSchema),
  validate('body', updateTalentProfileBodySchema),
  updateTalentProfileController,
);
adminTalentProfilesRouter.post(
  '/:id/show',
  validate('params', talentProfileIdParamsSchema),
  showTalentProfileController,
);
adminTalentProfilesRouter.post(
  '/:id/hide',
  validate('params', talentProfileIdParamsSchema),
  hideTalentProfileController,
);
adminTalentProfilesRouter.post(
  '/:id/deactivate',
  validate('params', talentProfileIdParamsSchema),
  deactivateTalentController,
);
adminTalentProfilesRouter.post(
  '/:id/reactivate',
  validate('params', talentProfileIdParamsSchema),
  reactivateTalentController,
);
adminTalentProfilesRouter.post(
  '/:id/invitation',
  validate('params', talentProfileIdParamsSchema),
  resendTalentInvitationController,
);

// Create profile from application
export const adminCreateProfileRouter = Router();
adminCreateProfileRouter.use(requireAuth, requireRole('admin'));
adminCreateProfileRouter.post(
  '/:id/create-profile',
  validate('params', talentApplicationIdParamsSchema),
  validate('body', createTalentProfileBodySchema),
  createTalentProfileController,
);
