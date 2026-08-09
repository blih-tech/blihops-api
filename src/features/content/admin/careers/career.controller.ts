import type { Request, Response } from 'express';
import { z } from 'zod';

import { sendMany, sendSuccess } from '../../../../shared/utils/response.js';
import {
  createCareerBodySchema,
  patchCareerBodySchema,
  type adminCareerListQuerySchema,
} from './career.schema.js';
import {
  createCareer,
  deleteCareer,
  getAdminCareer,
  listAdminCareers,
  updateCareer,
} from './career.service.js';

export async function getAdminCareersController(
  req: Request<
    Record<string, string>,
    unknown,
    unknown,
    z.infer<typeof adminCareerListQuerySchema>
  >,
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
  req: Request<{ id: string }>,
  res: Response,
) {
  const career = await getAdminCareer(req.params.id);
  sendSuccess(res, career);
}

export async function createCareerController(
  req: Request<
    Record<string, string>,
    unknown,
    z.infer<typeof createCareerBodySchema>
  >,
  res: Response,
) {
  const career = await createCareer(req.body);
  sendSuccess(res, career, 201);
}

export async function updateCareerController(
  req: Request<{ id: string }, unknown, z.infer<typeof patchCareerBodySchema>>,
  res: Response,
) {
  const career = await updateCareer(req.params.id, req.body);
  sendSuccess(res, career);
}

export async function deleteCareerController(
  req: Request<{ id: string }>,
  res: Response,
) {
  await deleteCareer(req.params.id);
  res.status(204).end();
}
