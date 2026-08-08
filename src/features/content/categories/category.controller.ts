import type { Request, Response } from 'express';

import { setPublicCache } from '../common/cache.js';
import { sendMany } from '../../../shared/utils/response.js';
import { listCategories } from './category.service.js';

export async function listCategoriesController(_req: Request, res: Response) {
  const categories = await listCategories();
  setPublicCache(res);
  sendMany(res, categories, {});
}
