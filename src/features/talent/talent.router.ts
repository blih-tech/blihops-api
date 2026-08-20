import { Router } from 'express';

import {
  adminTalentApplicationsRouter,
  publicTalentApplicationsRouter,
} from './applications/application.router.js';
import { publicCompletionRouter } from './completion/completion.router.js';

// Ensure OpenAPI paths are registered
import './applications/application.paths.js';
import './completion/completion.paths.js';

export const talentRouter = Router();

// Public: POST /api/v1/talent-applications
talentRouter.use('/talent-applications', publicTalentApplicationsRouter);

// Admin: /api/v1/admin/talent-applications (includes status, notes, and completion-request)
talentRouter.use('/admin/talent-applications', adminTalentApplicationsRouter);

// Public completion: /api/v1/profile-completion-requests/:token
talentRouter.use('/profile-completion-requests', publicCompletionRouter);
