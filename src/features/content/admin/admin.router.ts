import { Router } from 'express';

import { requireAuth, requireRole } from '../../../shared/middlewares/auth.js';
import { adminCategoryRouter } from './categories/index.js';
import { adminLogoRouter } from './logos/index.js';
import { adminTagRouter } from './tags/index.js';
import { adminTestimonialRouter } from './testimonials/index.js';

export const adminContentRouter = Router();

adminContentRouter.use(requireAuth, requireRole('admin'));

adminContentRouter.use('/tags', adminTagRouter);
adminContentRouter.use('/categories', adminCategoryRouter);
adminContentRouter.use('/logos', adminLogoRouter);
adminContentRouter.use('/testimonials', adminTestimonialRouter);
