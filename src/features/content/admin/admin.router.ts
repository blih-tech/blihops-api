import { Router } from 'express';

import { requireAuth, requireRole } from '../../../shared/middlewares/auth.js';
import { adminTagRouter } from './tags/index.js';

export const adminContentRouter = Router();

adminContentRouter.use(requireAuth, requireRole('admin'));

adminContentRouter.use('/tags', adminTagRouter);
