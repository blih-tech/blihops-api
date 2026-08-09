import type { Request, Response } from 'express';
import { z } from 'zod';

import { setPublicCache } from '../common/cache.js';
import { sendMany, sendSuccess } from '../../../shared/utils/response.js';
import type { careerListQuerySchema } from './career.schema.js';
import { getPublicCareerBySlug, listPublicCareers } from './career.service.js';

export async function listCareersController(
  req: Request<
    Record<string, string>,
    unknown,
    unknown,
    z.infer<typeof careerListQuerySchema>
  >,
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
  req: Request<{ slug: string }>,
  res: Response,
) {
  const career = await getPublicCareerBySlug(req.params.slug);
  setPublicCache(res);
  sendSuccess(res, career);
}
