import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import {
  idParamSchema,
  mediaUrlSchema,
  longTextSchema,
  shortTextSchema,
} from '../../common/schemas.js';
import {
  getTestimonialsResponseSchema,
  testimonialsSchema,
} from '../../testimonials/testimonial.schema.js';

extendZodWithOpenApi(z);

export { getTestimonialsResponseSchema };

export const createTestimonialBodySchema = z.object({
  avatarUrl: mediaUrlSchema,
  name: shortTextSchema,
  role: shortTextSchema,
  company: shortTextSchema,
  quote: longTextSchema,
});

export const createTestimonialResponseSchema = z.object({
  data: testimonialsSchema,
});

export const updateTestimonialParamsSchema = z.object({
  id: idParamSchema,
});

export const updateTestimonialBodySchema = z
  .object({
    avatarUrl: mediaUrlSchema.optional(),
    name: shortTextSchema.optional(),
    role: shortTextSchema.optional(),
    company: shortTextSchema.optional(),
    quote: longTextSchema.optional(),
    isPrimary: z.literal(true).optional(),
  })
  .refine(
    (data) =>
      data.avatarUrl !== undefined ||
      data.name !== undefined ||
      data.role !== undefined ||
      data.company !== undefined ||
      data.quote !== undefined ||
      data.isPrimary !== undefined,
    {
      message: 'At least one field is required',
      path: ['avatarUrl'],
    },
  )
  .describe('At least one field is required');

export const updateTestimonialResponseSchema = z.object({
  data: testimonialsSchema,
});

export const deleteTestimonialParamsSchema = z.object({
  id: idParamSchema,
});
