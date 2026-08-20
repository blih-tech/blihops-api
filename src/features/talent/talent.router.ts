import { Router } from 'express';

import {
  adminTalentApplicationsRouter,
  publicTalentApplicationsRouter,
} from './applications/application.router.js';
import { publicCompletionRouter } from './completion/completion.router.js';
import {
  adminCreateProfileRouter,
  adminTalentProfilesRouter,
} from './profiles/profile.router.js';
import { talentPortalRouter } from './portal/portal.router.js';

// Ensure OpenAPI paths are registered
import './applications/application.paths.js';
import './completion/completion.paths.js';
import './profiles/profile.paths.js';
import './portal/portal.paths.js';

export const talentRouter = Router();

// Public: POST /api/v1/talent-applications
talentRouter.use('/talent-applications', publicTalentApplicationsRouter);

// Admin: /api/v1/admin/talent-applications (includes status, notes, and completion-request)
talentRouter.use('/admin/talent-applications', adminTalentApplicationsRouter);
// Admin create profile from application
talentRouter.use('/admin/talent-applications', adminCreateProfileRouter);

// Admin talent profiles
talentRouter.use('/admin/talent-profiles', adminTalentProfilesRouter);

// Public completion: /api/v1/profile-completion-requests/:token
talentRouter.use('/profile-completion-requests', publicCompletionRouter);

// Talent portal (session-derived)
talentRouter.use('/talent', talentPortalRouter);
