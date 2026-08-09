import type { Request, Response } from 'express';

import { setPublicCache } from '../common/cache.js';
import { sendMany } from '../../../shared/utils/response.js';
import { listPublicFaqs } from './faq.service.js';

export async function listFaqsController(_req: Request, res: Response) {
  const faqs = await listPublicFaqs();
  setPublicCache(res);
  sendMany(res, faqs, {});
}
