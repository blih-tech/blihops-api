import type { Request, Response } from 'express';

import {
  type BodyAndParamsOf,
  type BodyOf,
  type ParamsOf,
} from '../../../../shared/middlewares/validate.js';
import { sendMany, sendSuccess } from '../../../../shared/utils/response.js';
import { listCategories } from '../../categories/category.service.js';
import {
  createCategoryBodySchema,
  deleteCategoryParamsSchema,
  updateCategoryBodySchema,
  updateCategoryParamsSchema,
} from './category.schema.js';
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from './category.service.js';

export async function getAdminCategoriesController(
  _req: Request,
  res: Response,
) {
  const categories = await listCategories();
  sendMany(res, categories, {});
}

export async function createCategoryController(
  req: BodyOf<typeof createCategoryBodySchema>,
  res: Response,
) {
  const category = await createCategory(req.body);
  sendSuccess(res, category, 201);
}

export async function updateCategoryController(
  req: BodyAndParamsOf<
    typeof updateCategoryBodySchema,
    typeof updateCategoryParamsSchema
  >,
  res: Response,
) {
  const category = await updateCategory(req.params.id, req.body);
  sendSuccess(res, category);
}

export async function deleteCategoryController(
  req: ParamsOf<typeof deleteCategoryParamsSchema>,
  res: Response,
) {
  await deleteCategory(req.params.id);
  res.status(204).end();
}
