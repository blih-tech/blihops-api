import { Router } from 'express';

import { requireAuth, requireRole } from '../../../shared/middlewares/auth.js';
import { adminCareerRouter } from './careers/index.js';
import { adminCaseStudyRouter } from './case-studies/index.js';
import { adminCategoryRouter } from './categories/index.js';
import { adminFaqRouter } from './faqs/index.js';
import { adminInsightRouter } from './insights/index.js';
import { adminLogoRouter } from './logos/index.js';
import { adminServicesHeroRouter } from './services-hero/index.js';
import { adminTagRouter } from './tags/index.js';
import { adminTestimonialRouter } from './testimonials/index.js';

export const adminContentRouter = Router();

adminContentRouter.use(requireAuth, requireRole('admin'));

adminContentRouter.use('/tags', adminTagRouter);
adminContentRouter.use('/categories', adminCategoryRouter);
adminContentRouter.use('/logos', adminLogoRouter);
adminContentRouter.use('/testimonials', adminTestimonialRouter);
adminContentRouter.use('/services-hero', adminServicesHeroRouter);
adminContentRouter.use('/case-studies', adminCaseStudyRouter);
adminContentRouter.use('/insights', adminInsightRouter);
adminContentRouter.use('/careers', adminCareerRouter);
adminContentRouter.use('/faqs', adminFaqRouter);
