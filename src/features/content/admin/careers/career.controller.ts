import type { Response } from 'express';

import {
  type BodyAndParamsOf,
  type BodyOf,
  type ParamsOf,
  type QueryOf,
} from '../../../../shared/middlewares/validate.js';
import { sendMany, sendSuccess } from '../../../../shared/utils/response.js';
import {
  adminCareerListQuerySchema,
  careerIdParamsSchema,
  createCareerBodySchema,
  patchCareerBodySchema,
} from './career.schema.js';
import {
  createCareer,
  deleteCareer,
  getAdminCareer,
  listAdminCareers,
  updateCareer,
} from './career.service.js';

export async function getAdminCareersController(
  req: QueryOf<typeof adminCareerListQuerySchema>,
  res: Response,
) {
  const page = req.query.page ?? 1;
  const pageSize = req.query.pageSize ?? 12;
  const params: {
    page: number;
    pageSize: number;
    isActive?: boolean;
  } = { page, pageSize };
  if (req.query.isActive !== undefined) {
    params.isActive = req.query.isActive === 'true';
  }
  const { items, total } = await listAdminCareers(params);
  sendMany(res, items, {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function getAdminCareerController(
  req: ParamsOf<typeof careerIdParamsSchema>,
  res: Response,
) {
  const career = await getAdminCareer(req.params.id);
  sendSuccess(res, career);
}

export async function createCareerController(
  req: BodyOf<typeof createCareerBodySchema>,
  res: Response,
) {
  const career = await createCareer(req.body);
  sendSuccess(res, career, 201);
}

export async function updateCareerController(
  req: BodyAndParamsOf<
    typeof patchCareerBodySchema,
    typeof careerIdParamsSchema
  >,
  res: Response,
) {
  const career = await updateCareer(req.params.id, req.body);
  sendSuccess(res, career);
}

export async function deleteCareerController(
  req: ParamsOf<typeof careerIdParamsSchema>,
  res: Response,
) {
  await deleteCareer(req.params.id);
  res.status(204).end();
}
