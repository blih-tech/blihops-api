import {
  ConflictError,
  NotFoundError,
} from '../../../../shared/errors/httpErrors.js';
import {
  isForeignKeyViolation,
  isRecordNotFound,
  isUniqueViolation,
} from '../../common/prismaErrors.js';
import type { CategoryResponse } from '../../categories/category.schema.js';
import { toCategoryResponse } from '../../categories/category.service.js';
import {
  createCategoryRecord,
  deleteCategoryRecord,
  findCategoryById,
  findCategoryByName,
  updateCategoryRecord,
} from './category.repository.js';

export async function createCategory(payload: {
  name: string;
}): Promise<CategoryResponse> {
  const existing = await findCategoryByName(payload.name);
  if (existing !== null) {
    throw new ConflictError('A category with this name already exists');
  }

  try {
    const category = await createCategoryRecord(payload);
    return toCategoryResponse(category);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ConflictError('A category with this name already exists');
    }
    throw err;
  }
}

export async function updateCategory(
  id: string,
  payload: { name: string },
): Promise<CategoryResponse> {
  const existingCategory = await findCategoryById(id);
  if (existingCategory === null) {
    throw new NotFoundError('Category not found');
  }

  const nameTaken = await findCategoryByName(payload.name);
  if (nameTaken !== null && nameTaken.id !== id) {
    throw new ConflictError('A category with this name already exists');
  }

  try {
    const category = await updateCategoryRecord(id, payload.name);
    return toCategoryResponse(category);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ConflictError('A category with this name already exists');
    }
    if (isRecordNotFound(err)) {
      throw new NotFoundError('Category not found');
    }
    throw err;
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const existingCategory = await findCategoryById(id);
  if (existingCategory === null) {
    throw new NotFoundError('Category not found');
  }

  try {
    await deleteCategoryRecord(id);
  } catch (err) {
    if (isForeignKeyViolation(err)) {
      throw new ConflictError(
        'This category is in use by case studies or insights and cannot be deleted',
      );
    }
    if (isRecordNotFound(err)) {
      throw new NotFoundError('Category not found');
    }
    throw err;
  }
}
