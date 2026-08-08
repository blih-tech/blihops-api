import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { metaSchema } from '../common/schemas.js';

extendZodWithOpenApi(z);

export const logosSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  alt: z.string(),
});

export const getLogosResponseSchema = z.object({
  items: z.array(logosSchema),
  meta: metaSchema,
});

export type LogoResponse = z.infer<typeof logosSchema>;
