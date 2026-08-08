import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { metaSchema } from '../common/schemas.js';

extendZodWithOpenApi(z);

export const categoriesSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const getCategoriesResponseSchema = z.object({
  items: z.array(categoriesSchema),
  meta: metaSchema,
});

export type CategoryResponse = z.infer<typeof categoriesSchema>;
