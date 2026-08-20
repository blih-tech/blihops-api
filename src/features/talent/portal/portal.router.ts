import { Router } from 'express';

import { requireAuth, requireRole } from '../../../shared/middlewares/auth.js';
import { validate } from '../../../shared/middlewares/validate.js';
import {
  getTalentMeController,
  getTalentPortalProfileController,
  patchTalentPortalProfileController,
} from './portal.controller.js';
import { updateTalentPortalBodySchema } from './portal.schema.js';

export const talentPortalRouter = Router();
talentPortalRouter.use(requireAuth, requireRole('talent'));

talentPortalRouter.get('/me', getTalentMeController);
talentPortalRouter.get('/profile', getTalentPortalProfileController);
talentPortalRouter.patch(
  '/profile',
  validate('body', updateTalentPortalBodySchema),
  patchTalentPortalProfileController,
);
