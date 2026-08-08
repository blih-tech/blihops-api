import { Router } from 'express';

import { validate } from '../../../../shared/middlewares/validate.js';
import {
  createCategoryBodySchema,
  deleteCategoryParamsSchema,
  updateCategoryBodySchema,
  updateCategoryParamsSchema,
} from './category.schema.js';
import {
  createCategoryController,
  deleteCategoryController,
  getAdminCategoriesController,
  updateCategoryController,
} from './category.controller.js';

export const adminCategoryRouter = Router();

adminCategoryRouter.get('/', getAdminCategoriesController);

adminCategoryRouter.post(
  '/',
  validate('body', createCategoryBodySchema),
  createCategoryController,
);

adminCategoryRouter.patch(
  '/:id',
  validate('params', updateCategoryParamsSchema),
  validate('body', updateCategoryBodySchema),
  updateCategoryController,
);

adminCategoryRouter.delete(
  '/:id',
  validate('params', deleteCategoryParamsSchema),
  deleteCategoryController,
);
