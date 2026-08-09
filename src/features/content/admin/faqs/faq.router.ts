import { Router } from 'express';

import { validate } from '../../../../shared/middlewares/validate.js';
import {
  createFaqBodySchema,
  faqIdParamsSchema,
  patchFaqBodySchema,
} from './faq.schema.js';
import {
  createFaqController,
  deleteFaqController,
  getAdminFaqController,
  getAdminFaqsController,
  updateFaqController,
} from './faq.controller.js';

export const adminFaqRouter = Router();

adminFaqRouter.get('/', getAdminFaqsController);

adminFaqRouter.get(
  '/:id',
  validate('params', faqIdParamsSchema),
  getAdminFaqController,
);

adminFaqRouter.post(
  '/',
  validate('body', createFaqBodySchema),
  createFaqController,
);

adminFaqRouter.patch(
  '/:id',
  validate('params', faqIdParamsSchema),
  validate('body', patchFaqBodySchema),
  updateFaqController,
);

adminFaqRouter.delete(
  '/:id',
  validate('params', faqIdParamsSchema),
  deleteFaqController,
);
