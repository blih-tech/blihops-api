import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import {
  idParamSchema,
  metaSchema,
  pageQuerySchema,
  slugSchema,
} from '../../common/schemas.js';
import {
  careerListItemSchema,
  careersSchema,
  getCareerDetailResponseSchema,
  getCareersResponseSchema,
} from '../../careers/career.schema.js';

extendZodWithOpenApi(z);

export { getCareerDetailResponseSchema, getCareersResponseSchema };

export const adminCareerListItemSchema = careerListItemSchema.extend({
  isActive: z.boolean(),
});

export const getAdminCareersResponseSchema = z.object({
  items: z.array(adminCareerListItemSchema),
  meta: metaSchema,
});

export type AdminCareerListItem = z.infer<typeof adminCareerListItemSchema>;

export const careerIdParamsSchema = z.object({
  id: idParamSchema,
});

export const careerTitleSchema = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(150, 'Keep the title under 150 characters');

export const careerTextFieldSchema = z
  .string()
  .trim()
  .min(1, 'Text is required')
  .max(500, 'Keep the text under 500 characters');

export const careerListFieldSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, 'List entries cannot be empty')
      .max(500, 'Keep list entries under 500 characters'),
  )
  .min(1, 'At least one entry is required');

export const createCareerBodySchema = z.object({
  title: careerTitleSchema,
  slug: slugSchema,
  department: careerTextFieldSchema,
  location: careerTextFieldSchema,
  employmentType: careerTextFieldSchema,
  summary: careerTextFieldSchema,
  overview: careerListFieldSchema,
  responsibilities: careerListFieldSchema,
  requirements: careerListFieldSchema,
});

export const createCareerResponseSchema = z.object({
  data: careersSchema,
});

export const patchCareerBodySchema = z
  .strictObject({
    title: careerTitleSchema.optional(),
    slug: slugSchema.optional(),
    department: careerTextFieldSchema.optional(),
    location: careerTextFieldSchema.optional(),
    employmentType: careerTextFieldSchema.optional(),
    summary: careerTextFieldSchema.optional(),
    overview: careerListFieldSchema.optional(),
    responsibilities: careerListFieldSchema.optional(),
    requirements: careerListFieldSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'At least one field is required',
        path: ['title'],
      });
    }
  });

export const patchCareerResponseSchema = z.object({
  data: careersSchema,
});

export const adminCareerListQuerySchema = z.object({
  ...pageQuerySchema.shape,
  isActive: z.enum(['true', 'false']).optional(),
});

export type CreateCareerPayload = z.infer<typeof createCareerBodySchema>;
export type PatchCareerPayload = z.infer<typeof patchCareerBodySchema>;
