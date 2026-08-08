import type { Request, Response } from 'express';
import { z } from 'zod';

import { setPublicCache } from '../common/cache.js';
import { sendMany, sendSuccess } from '../../../shared/utils/response.js';
import type { insightListQuerySchema } from './insight.schema.js';
import {
  getPublicInsightBySlug,
  listPublicInsights,
} from './insight.service.js';

export async function listInsightsController(
  req: Request<
    Record<string, string>,
    unknown,
    unknown,
    z.infer<typeof insightListQuerySchema>
  >,
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
  req: Request<{ slug: string }>,
  res: Response,
) {
  const insight = await getPublicInsightBySlug(req.params.slug);
  setPublicCache(res);
  sendSuccess(res, insight);
}
