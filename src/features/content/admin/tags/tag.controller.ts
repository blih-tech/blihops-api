import type { Request, Response } from 'express';

import { sendMany, sendSuccess } from '../../../../shared/utils/response.js';
import { listTags } from '../../tags/tag.service.js';
import { createTag, deleteTag, updateTag } from './tag.service.js';

export async function getAdminTagsController(_req: Request, res: Response) {
  const tags = await listTags();
  sendMany(res, tags, {});
}

export async function createTagController(
  req: Request<Record<string, string>, unknown, { name: string }>,
  res: Response,
) {
  const tag = await createTag(req.body);
  sendSuccess(res, tag, 201);
}

export async function updateTagController(
  req: Request<{ id: string }, unknown, { name: string }>,
  res: Response,
) {
  const tag = await updateTag(req.params.id, req.body);
  sendSuccess(res, tag);
}

export async function deleteTagController(
  req: Request<{ id: string }>,
  res: Response,
) {
  await deleteTag(req.params.id);
  res.status(204).end();
}
