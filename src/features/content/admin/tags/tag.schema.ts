import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { idParamSchema, nameSchema } from '../../common/schemas.js';
import { getTagsResponseSchema, tagsSchema } from '../../tags/tag.schema.js';

extendZodWithOpenApi(z);

export { getTagsResponseSchema };

const tagNameBodySchema = z.object({
  name: nameSchema,
});

export const createTagBodySchema = tagNameBodySchema;

export const createTagResponseSchema = z.object({
  data: tagsSchema,
});

export const updateTagParamsSchema = z.object({
  id: idParamSchema,
});

export const updateTagBodySchema = tagNameBodySchema;

export const updateTagResponseSchema = z.object({
  data: tagsSchema,
});

export const deleteTagParamsSchema = z.object({
  id: idParamSchema,
});
