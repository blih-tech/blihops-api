import type { Request, Response } from 'express';

import { setPublicCache } from '../common/cache.js';
import { sendSuccess } from '../../../shared/utils/response.js';
import { getServicesHero } from './servicesHero.service.js';

export async function getServicesHeroController(_req: Request, res: Response) {
  const hero = await getServicesHero();
  setPublicCache(res);
  sendSuccess(res, hero);
}
