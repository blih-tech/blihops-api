import type { Response } from 'express';

import type {
  BodyAndParamsOf,
  BodyOf,
  ParamsOf,
  QueryOf,
} from '../../../shared/middlewares/validate.js';
import { sendMany, sendSuccess } from '../../../shared/utils/response.js';
import {
  createTalentApplicationBodySchema,
  patchTalentApplicationNotesBodySchema,
  patchTalentApplicationStatusBodySchema,
  talentApplicationIdParamsSchema,
  talentApplicationListQuerySchema,
} from './application.schema.js';
import {
  createTalentApplication,
  getTalentApplication,
  listTalentApplications,
  updateTalentApplicationNotes,
  updateTalentApplicationStatus,
} from './application.service.js';

export async function createTalentApplicationController(
  req: BodyOf<typeof createTalentApplicationBodySchema>,
  res: Response,
) {
  const result = await createTalentApplication(req.body);
  sendSuccess(res, result, 201);
}

export async function listTalentApplicationsController(
  req: QueryOf<typeof talentApplicationListQuerySchema>,
  res: Response,
) {
  const page = req.query.page ?? 1;
  const pageSize = req.query.pageSize ?? 20;
  const { items, total } = await listTalentApplications({
    status: req.query.status,
    q: req.query.q,
    page,
    pageSize,
  });
  sendMany(res, items, {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function getTalentApplicationController(
  req: ParamsOf<typeof talentApplicationIdParamsSchema>,
  res: Response,
) {
  const data = await getTalentApplication(req.params.id);
  sendSuccess(res, data);
}

export async function patchTalentApplicationStatusController(
  req: BodyAndParamsOf<
    typeof patchTalentApplicationStatusBodySchema,
    typeof talentApplicationIdParamsSchema
  >,
  res: Response,
) {
  const data = await updateTalentApplicationStatus(
    req.params.id,
    req.body.status,
  );
  sendSuccess(res, data);
}

export async function patchTalentApplicationNotesController(
  req: BodyAndParamsOf<
    typeof patchTalentApplicationNotesBodySchema,
    typeof talentApplicationIdParamsSchema
  >,
  res: Response,
) {
  const data = await updateTalentApplicationNotes(
    req.params.id,
    req.body.internalNotes,
  );
  sendSuccess(res, data);
}
