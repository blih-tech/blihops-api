import { Router } from 'express';

import {
  adminTalentApplicationsRouter,
  publicTalentApplicationsRouter,
} from './applications/application.router.js';

// Ensure OpenAPI paths are registered
import './applications/application.paths.js';

export const talentRouter = Router();

// Public: POST /api/v1/talent-applications
talentRouter.use('/talent-applications', publicTalentApplicationsRouter);

// Admin: /api/v1/admin/talent-applications
talentRouter.use('/admin/talent-applications', adminTalentApplicationsRouter);
