import type { Request, Response } from 'express';
import { z } from 'zod';

import { sendMany, sendSuccess } from '../../../../shared/utils/response.js';
import {
  createCaseStudyBodySchema,
  patchCaseStudyBodySchema,
  type adminCaseStudyListQuerySchema,
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
  req: Request<
    Record<string, string>,
    unknown,
    unknown,
    z.infer<typeof adminCaseStudyListQuerySchema>
  >,
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
  req: Request<{ id: string }>,
  res: Response,
) {
  const caseStudy = await getAdminCaseStudy(req.params.id);
  sendSuccess(res, caseStudy);
}

export async function createCaseStudyController(
  req: Request<
    Record<string, string>,
    unknown,
    z.infer<typeof createCaseStudyBodySchema>
  >,
  res: Response,
) {
  const caseStudy = await createCaseStudy(req.body);
  sendSuccess(res, caseStudy, 201);
}

export async function updateCaseStudyController(
  req: Request<
    { id: string },
    unknown,
    z.infer<typeof patchCaseStudyBodySchema>
  >,
  res: Response,
) {
  const caseStudy = await updateCaseStudy(req.params.id, req.body);
  sendSuccess(res, caseStudy);
}

export async function publishCaseStudyController(
  req: Request<{ id: string }>,
  res: Response,
) {
  const caseStudy = await publishCaseStudy(req.params.id);
  sendSuccess(res, caseStudy);
}

export async function unpublishCaseStudyController(
  req: Request<{ id: string }>,
  res: Response,
) {
  const caseStudy = await unpublishCaseStudy(req.params.id);
  sendSuccess(res, caseStudy);
}

export async function deleteCaseStudyController(
  req: Request<{ id: string }>,
  res: Response,
) {
  await deleteCaseStudy(req.params.id);
  res.status(204).end();
}
