import type { Request, Response } from 'express';

import { sendMany } from '../../../shared/utils/response.js';
import { setPublicCache } from '../common/cache.js';
import { listAllServices } from './service.service.js';

export async function listServicesController(_req: Request, res: Response) {
  const services = await listAllServices();
  setPublicCache(res);
  sendMany(res, services, {});
}
