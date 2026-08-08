import { Router } from 'express';

import { validate } from '../../../shared/middlewares/validate.js';
import {
  caseStudyListQuerySchema,
  caseStudySlugParamsSchema,
} from './caseStudy.schema.js';
import {
  getCaseStudyBySlugController,
  listCaseStudiesController,
} from './caseStudy.controller.js';

export const caseStudyRouter = Router();

caseStudyRouter.get(
  '/',
  validate('query', caseStudyListQuerySchema),
  listCaseStudiesController,
);

caseStudyRouter.get(
  '/:slug',
  validate('params', caseStudySlugParamsSchema),
  getCaseStudyBySlugController,
);
