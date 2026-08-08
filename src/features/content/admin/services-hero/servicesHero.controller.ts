import type { Request, Response } from 'express';

import { sendSuccess } from '../../../../shared/utils/response.js';
import {
  getServicesHero,
  toServicesHeroResponse,
} from '../../services-hero/servicesHero.service.js';
import {
  type PutServicesHeroPayload,
  saveServicesHero,
} from './servicesHero.service.js';

export async function getAdminServicesHeroController(
  _req: Request,
  res: Response,
) {
  const hero = await getServicesHero();
  sendSuccess(res, hero);
}

export async function putServicesHeroController(
  req: Request<Record<string, string>, unknown, PutServicesHeroPayload>,
  res: Response,
) {
  const hero = await saveServicesHero(req.body);
  sendSuccess(res, toServicesHeroResponse(hero));
}
