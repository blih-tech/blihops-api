import type { Request, Response } from 'express';

import { setPublicCache } from '../common/cache.js';
import { sendMany } from '../../../shared/utils/response.js';
import { listLogos } from './logo.service.js';

export async function listLogosController(_req: Request, res: Response) {
  const logos = await listLogos();
  setPublicCache(res);
  sendMany(res, logos, {});
}
