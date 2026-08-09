import type { Request, Response } from 'express';

import {
  type BodyAndParamsOf,
  type BodyOf,
  type ParamsOf,
} from '../../../../shared/middlewares/validate.js';
import { sendMany, sendSuccess } from '../../../../shared/utils/response.js';
import { listTags } from '../../tags/tag.service.js';
import {
  createTagBodySchema,
  deleteTagParamsSchema,
  updateTagBodySchema,
  updateTagParamsSchema,
} from './tag.schema.js';
import { createTag, deleteTag, updateTag } from './tag.service.js';

export async function getAdminTagsController(_req: Request, res: Response) {
  const tags = await listTags();
  sendMany(res, tags, {});
}

export async function createTagController(
  req: BodyOf<typeof createTagBodySchema>,
  res: Response,
) {
  const tag = await createTag(req.body);
  sendSuccess(res, tag, 201);
}

export async function updateTagController(
  req: BodyAndParamsOf<
    typeof updateTagBodySchema,
    typeof updateTagParamsSchema
  >,
  res: Response,
) {
  const tag = await updateTag(req.params.id, req.body);
  sendSuccess(res, tag);
}

export async function deleteTagController(
  req: ParamsOf<typeof deleteTagParamsSchema>,
  res: Response,
) {
  await deleteTag(req.params.id);
  res.status(204).end();
}
