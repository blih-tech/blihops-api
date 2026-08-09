import type { Request, Response } from 'express';

import {
  type BodyAndParamsOf,
  type BodyOf,
  type ParamsOf,
} from '../../../../shared/middlewares/validate.js';
import { sendMany, sendSuccess } from '../../../../shared/utils/response.js';
import { listLogos } from '../../logos/logo.service.js';
import {
  createLogoBodySchema,
  deleteLogoParamsSchema,
  updateLogoBodySchema,
  updateLogoParamsSchema,
} from './logo.schema.js';
import { createLogo, deleteLogo, updateLogo } from './logo.service.js';

export async function getAdminLogosController(_req: Request, res: Response) {
  const logos = await listLogos();
  sendMany(res, logos, {});
}

export async function createLogoController(
  req: BodyOf<typeof createLogoBodySchema>,
  res: Response,
) {
  const logo = await createLogo(req.body);
  sendSuccess(res, logo, 201);
}

export async function updateLogoController(
  req: BodyAndParamsOf<
    typeof updateLogoBodySchema,
    typeof updateLogoParamsSchema
  >,
  res: Response,
) {
  const logo = await updateLogo(req.params.id, req.body);
  sendSuccess(res, logo);
}

export async function deleteLogoController(
  req: ParamsOf<typeof deleteLogoParamsSchema>,
  res: Response,
) {
  await deleteLogo(req.params.id);
  res.status(204).end();
}
