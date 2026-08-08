import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { metaSchema } from '../common/schemas.js';

extendZodWithOpenApi(z);

export const tagsSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const getTagsResponseSchema = z.object({
  items: z.array(tagsSchema),
  meta: metaSchema,
});

export type TagResponse = z.infer<typeof tagsSchema>;
