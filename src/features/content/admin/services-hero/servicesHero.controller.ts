import type { Request, Response } from 'express';

import { type BodyOf } from '../../../../shared/middlewares/validate.js';
import { sendSuccess } from '../../../../shared/utils/response.js';
import {
  getServicesHero,
  toServicesHeroResponse,
} from '../../services-hero/servicesHero.service.js';
import { putServicesHeroBodySchema } from './servicesHero.schema.js';
import { saveServicesHero } from './servicesHero.service.js';

export async function getAdminServicesHeroController(
  _req: Request,
  res: Response,
) {
  const hero = await getServicesHero();
  sendSuccess(res, hero);
}

export async function putServicesHeroController(
  req: BodyOf<typeof putServicesHeroBodySchema>,
  res: Response,
) {
  const hero = await saveServicesHero(req.body);
  sendSuccess(res, toServicesHeroResponse(hero));
}
