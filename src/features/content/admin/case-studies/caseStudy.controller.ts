import type { Response } from 'express';

import {
  type BodyAndParamsOf,
  type BodyOf,
  type ParamsOf,
  type QueryOf,
} from '../../../../shared/middlewares/validate.js';
import { sendMany, sendSuccess } from '../../../../shared/utils/response.js';
import {
  adminCaseStudyListQuerySchema,
  caseStudyIdParamsSchema,
  createCaseStudyBodySchema,
  patchCaseStudyBodySchema,
} from './caseStudy.schema.js';
import {
  createCaseStudy,
  deleteCaseStudy,
  getAdminCaseStudy,
  listAdminCaseStudies,
  publishCaseStudy,
  unpublishCaseStudy,
  updateCaseStudy,
} from './caseStudy.service.js';

export async function getAdminCaseStudiesController(
  req: QueryOf<typeof adminCaseStudyListQuerySchema>,
  res: Response,
) {
  const page = req.query.page ?? 1;
  const pageSize = req.query.pageSize ?? 12;
  const params: {
    page: number;
    pageSize: number;
    status?: 'DRAFT' | 'PUBLISHED';
    categoryId?: string;
  } = { page, pageSize };
  if (req.query.status !== undefined) params.status = req.query.status;
  if (req.query.categoryId !== undefined) {
    params.categoryId = req.query.categoryId;
  }
  const { items, total } = await listAdminCaseStudies(params);
  sendMany(res, items, {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function getAdminCaseStudyController(
  req: ParamsOf<typeof caseStudyIdParamsSchema>,
  res: Response,
) {
  const caseStudy = await getAdminCaseStudy(req.params.id);
  sendSuccess(res, caseStudy);
}

export async function createCaseStudyController(
  req: BodyOf<typeof createCaseStudyBodySchema>,
  res: Response,
) {
  const caseStudy = await createCaseStudy(req.body);
  sendSuccess(res, caseStudy, 201);
}

export async function updateCaseStudyController(
  req: BodyAndParamsOf<
    typeof patchCaseStudyBodySchema,
    typeof caseStudyIdParamsSchema
  >,
  res: Response,
) {
  const caseStudy = await updateCaseStudy(req.params.id, req.body);
  sendSuccess(res, caseStudy);
}

export async function publishCaseStudyController(
  req: ParamsOf<typeof caseStudyIdParamsSchema>,
  res: Response,
) {
  const caseStudy = await publishCaseStudy(req.params.id);
  sendSuccess(res, caseStudy);
}

export async function unpublishCaseStudyController(
  req: ParamsOf<typeof caseStudyIdParamsSchema>,
  res: Response,
) {
  const caseStudy = await unpublishCaseStudy(req.params.id);
  sendSuccess(res, caseStudy);
}

export async function deleteCaseStudyController(
  req: ParamsOf<typeof caseStudyIdParamsSchema>,
  res: Response,
) {
  await deleteCaseStudy(req.params.id);
  res.status(204).end();
}
