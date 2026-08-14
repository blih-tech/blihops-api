import type { Response } from 'express';

import {
  type BodyAndParamsOf,
  type ParamsOf,
  type QueryOf,
} from '../../../shared/middlewares/validate.js';
import { sendMany, sendSuccess } from '../../../shared/utils/response.js';
import {
  leadIdParamsSchema,
  leadListQuerySchema,
  patchLeadStatusBodySchema,
} from '../schema.js';
import {
  deleteLead,
  getLead,
  listLeads,
  updateLeadStatus,
} from '../service.js';

export async function listLeadsController(
  req: QueryOf<typeof leadListQuerySchema>,
  res: Response,
) {
  const page = req.query.page ?? 1;
  const pageSize = req.query.pageSize ?? 20;
  const params: {
    page: number;
    pageSize: number;
    type?: 'CONTACT' | 'PILOT' | 'CALL';
    status?: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED';
    q?: string;
  } = { page, pageSize };
  if (req.query.type !== undefined) params.type = req.query.type;
  if (req.query.status !== undefined) params.status = req.query.status;
  if (req.query.q !== undefined && req.query.q.length > 0) {
    params.q = req.query.q;
  }
  const { items, total } = await listLeads(params);
  sendMany(res, items, {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function getLeadController(
  req: ParamsOf<typeof leadIdParamsSchema>,
  res: Response,
) {
  const lead = await getLead(req.params.id);
  sendSuccess(res, lead);
}

export async function updateLeadStatusController(
  req: BodyAndParamsOf<
    typeof patchLeadStatusBodySchema,
    typeof leadIdParamsSchema
  >,
  res: Response,
) {
  const lead = await updateLeadStatus(req.params.id, req.body.status);
  sendSuccess(res, lead);
}

export async function deleteLeadController(
  req: ParamsOf<typeof leadIdParamsSchema>,
  res: Response,
) {
  await deleteLead(req.params.id);
  res.status(204).end();
}
