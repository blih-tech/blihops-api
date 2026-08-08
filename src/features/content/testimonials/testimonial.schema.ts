import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { metaSchema } from '../common/schemas.js';

extendZodWithOpenApi(z);

export const testimonialsSchema = z.object({
  id: z.string(),
  avatarUrl: z.string(),
  name: z.string(),
  role: z.string(),
  company: z.string(),
  quote: z.string(),
  isPrimary: z.boolean(),
});

export const getTestimonialsResponseSchema = z.object({
  items: z.array(testimonialsSchema),
  meta: metaSchema,
});

export type TestimonialResponse = z.infer<typeof testimonialsSchema>;
