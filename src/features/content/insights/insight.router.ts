import { Router } from 'express';

import { validate } from '../../../shared/middlewares/validate.js';
import {
  insightListQuerySchema,
  insightSlugParamsSchema,
} from './insight.schema.js';
import {
  getInsightBySlugController,
  listInsightsController,
} from './insight.controller.js';

export const insightRouter = Router();

insightRouter.get(
  '/',
  validate('query', insightListQuerySchema),
  listInsightsController,
);

insightRouter.get(
  '/:slug',
  validate('params', insightSlugParamsSchema),
  getInsightBySlugController,
);
