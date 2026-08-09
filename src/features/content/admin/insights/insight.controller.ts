import type { Response } from 'express';

import {
  type BodyAndParamsOf,
  type BodyOf,
  type ParamsOf,
  type QueryOf,
} from '../../../../shared/middlewares/validate.js';
import { sendMany, sendSuccess } from '../../../../shared/utils/response.js';
import {
  adminInsightListQuerySchema,
  createInsightBodySchema,
  insightIdParamsSchema,
  patchInsightBodySchema,
} from './insight.schema.js';
import {
  createInsight,
  deleteInsight,
  getAdminInsight,
  listAdminInsights,
  publishInsight,
  unpublishInsight,
  updateInsight,
} from './insight.service.js';

export async function getAdminInsightsController(
  req: QueryOf<typeof adminInsightListQuerySchema>,
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
  const { items, total } = await listAdminInsights(params);
  sendMany(res, items, {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function getAdminInsightController(
  req: ParamsOf<typeof insightIdParamsSchema>,
  res: Response,
) {
  const insight = await getAdminInsight(req.params.id);
  sendSuccess(res, insight);
}

export async function createInsightController(
  req: BodyOf<typeof createInsightBodySchema>,
  res: Response,
) {
  const insight = await createInsight(req.body);
  sendSuccess(res, insight, 201);
}

export async function updateInsightController(
  req: BodyAndParamsOf<
    typeof patchInsightBodySchema,
    typeof insightIdParamsSchema
  >,
  res: Response,
) {
  const insight = await updateInsight(req.params.id, req.body);
  sendSuccess(res, insight);
}

export async function publishInsightController(
  req: ParamsOf<typeof insightIdParamsSchema>,
  res: Response,
) {
  const insight = await publishInsight(req.params.id);
  sendSuccess(res, insight);
}

export async function unpublishInsightController(
  req: ParamsOf<typeof insightIdParamsSchema>,
  res: Response,
) {
  const insight = await unpublishInsight(req.params.id);
  sendSuccess(res, insight);
}

export async function deleteInsightController(
  req: ParamsOf<typeof insightIdParamsSchema>,
  res: Response,
) {
  await deleteInsight(req.params.id);
  res.status(204).end();
}
