import type { Response } from 'express';

import {
  type ParamsOf,
  type QueryOf,
} from '../../../shared/middlewares/validate.js';
import { setPublicCache } from '../common/cache.js';
import { sendMany, sendSuccess } from '../../../shared/utils/response.js';
import {
  insightListQuerySchema,
  insightSlugParamsSchema,
} from './insight.schema.js';
import {
  getPublicInsightBySlug,
  listPublicInsights,
} from './insight.service.js';

export async function listInsightsController(
  req: QueryOf<typeof insightListQuerySchema>,
  res: Response,
) {
  const page = req.query.page ?? 1;
  const pageSize = req.query.pageSize ?? 12;
  const { items, total } = await listPublicInsights(page, pageSize);
  setPublicCache(res);
  sendMany(res, items, {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function getInsightBySlugController(
  req: ParamsOf<typeof insightSlugParamsSchema>,
  res: Response,
) {
  const insight = await getPublicInsightBySlug(req.params.slug);
  setPublicCache(res);
  sendSuccess(res, insight);
}
