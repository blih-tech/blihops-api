import { Router } from 'express';

import { validate } from '../../../../shared/middlewares/validate.js';
import {
  createTagBodySchema,
  deleteTagParamsSchema,
  updateTagBodySchema,
  updateTagParamsSchema,
} from './tag.schema.js';
import {
  createTagController,
  deleteTagController,
  getAdminTagsController,
  updateTagController,
} from './tag.controller.js';

export const adminTagRouter = Router();

adminTagRouter.get('/', getAdminTagsController);

adminTagRouter.post(
  '/',
  validate('body', createTagBodySchema),
  createTagController,
);

adminTagRouter.patch(
  '/:id',
  validate('params', updateTagParamsSchema),
  validate('body', updateTagBodySchema),
  updateTagController,
);

adminTagRouter.delete(
  '/:id',
  validate('params', deleteTagParamsSchema),
  deleteTagController,
);
