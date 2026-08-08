import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { idParamSchema, nameSchema } from '../../common/schemas.js';
import {
  categoriesSchema,
  getCategoriesResponseSchema,
} from '../../categories/category.schema.js';

extendZodWithOpenApi(z);

export { getCategoriesResponseSchema };

const categoryNameBodySchema = z.object({
  name: nameSchema,
});

export const createCategoryBodySchema = categoryNameBodySchema;

export const createCategoryResponseSchema = z.object({
  data: categoriesSchema,
});

export const updateCategoryParamsSchema = z.object({
  id: idParamSchema,
});

export const updateCategoryBodySchema = categoryNameBodySchema;

export const updateCategoryResponseSchema = z.object({
  data: categoriesSchema,
});

export const deleteCategoryParamsSchema = z.object({
  id: idParamSchema,
});
