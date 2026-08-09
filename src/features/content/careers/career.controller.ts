import type { Response } from 'express';

import {
  type ParamsOf,
  type QueryOf,
} from '../../../shared/middlewares/validate.js';
import { setPublicCache } from '../common/cache.js';
import { sendMany, sendSuccess } from '../../../shared/utils/response.js';
import {
  careerListQuerySchema,
  careerSlugParamsSchema,
} from './career.schema.js';
import { getPublicCareerBySlug, listPublicCareers } from './career.service.js';

export async function listCareersController(
  req: QueryOf<typeof careerListQuerySchema>,
  res: Response,
) {
  const page = req.query.page ?? 1;
  const pageSize = req.query.pageSize ?? 12;
  const { items, total } = await listPublicCareers(page, pageSize);
  setPublicCache(res);
  sendMany(res, items, {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function getCareerBySlugController(
  req: ParamsOf<typeof careerSlugParamsSchema>,
  res: Response,
) {
  const career = await getPublicCareerBySlug(req.params.slug);
  setPublicCache(res);
  sendSuccess(res, career);
}
