import type { Request, Response } from 'express';

import { setPublicCache } from '../common/cache.js';
import { sendMany } from '../../../shared/utils/response.js';
import { listTags } from './tag.service.js';

export async function listTagsController(_req: Request, res: Response) {
  const tags = await listTags();
  setPublicCache(res);
  sendMany(res, tags, {});
}
