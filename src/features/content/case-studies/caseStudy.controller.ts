import type { Response } from 'express';

import {
  type ParamsOf,
  type QueryOf,
} from '../../../shared/middlewares/validate.js';
import { setPublicCache } from '../common/cache.js';
import { sendMany, sendSuccess } from '../../../shared/utils/response.js';
import {
  caseStudyListQuerySchema,
  caseStudySlugParamsSchema,
} from './caseStudy.schema.js';
import {
  getPublicCaseStudyBySlug,
  listPublicCaseStudies,
} from './caseStudy.service.js';

export async function listCaseStudiesController(
  req: QueryOf<typeof caseStudyListQuerySchema>,
  res: Response,
) {
  const page = req.query.page ?? 1;
  const pageSize = req.query.pageSize ?? 12;
  const { items, total } = await listPublicCaseStudies(page, pageSize);
  setPublicCache(res);
  sendMany(res, items, {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function getCaseStudyBySlugController(
  req: ParamsOf<typeof caseStudySlugParamsSchema>,
  res: Response,
) {
  const caseStudy = await getPublicCaseStudyBySlug(req.params.slug);
  setPublicCache(res);
  sendSuccess(res, caseStudy);
}
