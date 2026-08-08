import type { Request, Response } from 'express';

import { sendMany, sendSuccess } from '../../../../shared/utils/response.js';
import { listCategories } from '../../categories/category.service.js';
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
  req: Request<Record<string, string>, unknown, { name: string }>,
  res: Response,
) {
  const category = await createCategory(req.body);
  sendSuccess(res, category, 201);
}

export async function updateCategoryController(
  req: Request<{ id: string }, unknown, { name: string }>,
  res: Response,
) {
  const category = await updateCategory(req.params.id, req.body);
  sendSuccess(res, category);
}

export async function deleteCategoryController(
  req: Request<{ id: string }>,
  res: Response,
) {
  await deleteCategory(req.params.id);
  res.status(204).end();
}
