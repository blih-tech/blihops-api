import type { Category } from '../../../generated/prisma/client.js';
import type { CategoryResponse } from './category.schema.js';
import { findAllCategories } from './category.repository.js';

function toCategoryResponse(category: Category): CategoryResponse {
  return {
    id: category.id,
    name: category.name,
  };
}

export { toCategoryResponse };

export async function listCategories(): Promise<CategoryResponse[]> {
  const categories = await findAllCategories();
  return categories.map(toCategoryResponse);
}
