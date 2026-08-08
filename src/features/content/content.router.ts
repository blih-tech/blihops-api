import { Router } from 'express';

import { adminContentRouter } from './admin/admin.router.js';
import { caseStudyRouter } from './case-studies/index.js';
import { categoryRouter } from './categories/index.js';
import { logoRouter } from './logos/index.js';
import { servicesHeroRouter } from './services-hero/index.js';
import { tagRouter } from './tags/index.js';
import { testimonialRouter } from './testimonials/index.js';

export const contentRouter = Router();

contentRouter.use('/tags', tagRouter);
contentRouter.use('/categories', categoryRouter);
contentRouter.use('/logos', logoRouter);
contentRouter.use('/testimonials', testimonialRouter);
contentRouter.use('/services-hero', servicesHeroRouter);
contentRouter.use('/case-studies', caseStudyRouter);
contentRouter.use('/admin', adminContentRouter);
