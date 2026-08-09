import { Router } from 'express';

import { validate } from '../../../shared/middlewares/validate.js';
import {
  careerListQuerySchema,
  careerSlugParamsSchema,
} from './career.schema.js';
import {
  getCareerBySlugController,
  listCareersController,
} from './career.controller.js';

export const careerRouter = Router();

careerRouter.get(
  '/',
  validate('query', careerListQuerySchema),
  listCareersController,
);

careerRouter.get(
  '/:slug',
  validate('params', careerSlugParamsSchema),
  getCareerBySlugController,
);
