import type { Request, Response } from 'express';
import { z } from 'zod';

import { sendMany, sendSuccess } from '../../../../shared/utils/response.js';
import {
  createInsightBodySchema,
  patchInsightBodySchema,
  type adminInsightListQuerySchema,
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
  req: Request<
    Record<string, string>,
    unknown,
    unknown,
    z.infer<typeof adminInsightListQuerySchema>
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
  const { items, total } = await listAdminInsights(params);
  sendMany(res, items, {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function getAdminInsightController(
  req: Request<{ id: string }>,
  res: Response,
) {
  const insight = await getAdminInsight(req.params.id);
  sendSuccess(res, insight);
}

export async function createInsightController(
  req: Request<
    Record<string, string>,
    unknown,
    z.infer<typeof createInsightBodySchema>
  >,
  res: Response,
) {
  const insight = await createInsight(req.body);
  sendSuccess(res, insight, 201);
}

export async function updateInsightController(
  req: Request<{ id: string }, unknown, z.infer<typeof patchInsightBodySchema>>,
  res: Response,
) {
  const insight = await updateInsight(req.params.id, req.body);
  sendSuccess(res, insight);
}

export async function publishInsightController(
  req: Request<{ id: string }>,
  res: Response,
) {
  const insight = await publishInsight(req.params.id);
  sendSuccess(res, insight);
}

export async function unpublishInsightController(
  req: Request<{ id: string }>,
  res: Response,
) {
  const insight = await unpublishInsight(req.params.id);
  sendSuccess(res, insight);
}

export async function deleteInsightController(
  req: Request<{ id: string }>,
  res: Response,
) {
  await deleteInsight(req.params.id);
  res.status(204).end();
}
