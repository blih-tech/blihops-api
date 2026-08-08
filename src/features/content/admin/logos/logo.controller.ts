import type { Request, Response } from 'express';

import { sendMany, sendSuccess } from '../../../../shared/utils/response.js';
import { listLogos } from '../../logos/logo.service.js';
import {
  createLogo,
  deleteLogo,
  type CreateLogoPayload,
  type UpdateLogoPayload,
  updateLogo,
} from './logo.service.js';

export async function getAdminLogosController(_req: Request, res: Response) {
  const logos = await listLogos();
  sendMany(res, logos, {});
}

export async function createLogoController(
  req: Request<Record<string, string>, unknown, CreateLogoPayload>,
  res: Response,
) {
  const logo = await createLogo(req.body);
  sendSuccess(res, logo, 201);
}

export async function updateLogoController(
  req: Request<{ id: string }, unknown, UpdateLogoPayload>,
  res: Response,
) {
  const logo = await updateLogo(req.params.id, req.body);
  sendSuccess(res, logo);
}

export async function deleteLogoController(
  req: Request<{ id: string }>,
  res: Response,
) {
  await deleteLogo(req.params.id);
  res.status(204).end();
}
