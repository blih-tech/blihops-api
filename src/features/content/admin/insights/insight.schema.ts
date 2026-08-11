import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import {
  idParamSchema,
  mediaSchema,
  metaSchema,
  pageQuerySchema,
  slugSchema,
} from '../../common/schemas.js';
import {
  getInsightDetailResponseSchema,
  getInsightsResponseSchema,
  insightListItemSchema,
  insightsSchema,
} from '../../insights/insight.schema.js';

extendZodWithOpenApi(z);

export { getInsightDetailResponseSchema, getInsightsResponseSchema };

export const adminInsightListItemSchema = insightListItemSchema.extend({
  status: z.enum(['DRAFT', 'PUBLISHED']),
  bodyComplete: z.object({
    en: z.boolean(),
    de: z.boolean(),
  }),
});

export const getAdminInsightsResponseSchema = z.object({
  items: z.array(adminInsightListItemSchema),
  meta: metaSchema,
});

export type AdminInsightListItem = z.infer<typeof adminInsightListItemSchema>;

export const insightIdParamsSchema = z.object({
  id: idParamSchema,
});

export const authorSchema = z
  .string()
  .trim()
  .min(1, 'Author is required')
  .max(100, 'Keep the author name under 100 characters');

export const readTimeMinutesSchema = z
  .number()
  .int()
  .min(1, 'Read time must be at least 1 minute');

export const insightSectionPatchSchema = z.object({
  section: z
    .string()
    .trim()
    .min(1, 'Section title is required')
    .max(200, 'Keep the section title under 200 characters'),
  content: z.string().max(200_000),
});

export const partialInsightLocaleContentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Keep the title under 200 characters')
    .optional(),
  slug: slugSchema.optional(),
  excerpt: z
    .string()
    .trim()
    .min(1, 'Excerpt is required')
    .max(500, 'Keep the excerpt under 500 characters')
    .optional(),
  body: z.array(insightSectionPatchSchema).optional(),
});

export const fullInsightLocaleContentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Keep the title under 200 characters'),
  slug: slugSchema,
  excerpt: z
    .string()
    .trim()
    .min(1, 'Excerpt is required')
    .max(500, 'Keep the excerpt under 500 characters'),
  body: z
    .array(
      z.object({
        section: z.string().trim().min(1, 'Section title is required'),
        content: z.string().trim().min(1, 'Section content is required'),
      }),
    )
    .min(1, 'At least one section is required'),
});

export const createInsightBodySchema = z.object({
  author: authorSchema,
  categoryId: idParamSchema.nullable().optional(),
  media: mediaSchema.optional(),
  tags: z.array(idParamSchema).optional(),
  readTimeMinutes: readTimeMinutesSchema.optional(),
  content: z
    .object({
      en: partialInsightLocaleContentSchema.optional(),
      de: partialInsightLocaleContentSchema.optional(),
    })
    .optional(),
});

export const createInsightResponseSchema = z.object({
  data: insightsSchema,
});

const sharedFieldsPatchSchema = z.strictObject({
  author: authorSchema.optional(),
  categoryId: idParamSchema.nullable().optional(),
  media: mediaSchema.nullable().optional(),
  tags: z.array(idParamSchema).optional(),
  readTimeMinutes: readTimeMinutesSchema.optional(),
});

const localePatchSchema = z.strictObject({
  locale: z.string().min(1).max(2).describe('Locale to replace: en or de'),
  content: partialInsightLocaleContentSchema,
});

export const patchInsightBodySchema = z
  .union([sharedFieldsPatchSchema, localePatchSchema])
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'At least one field is required',
        path: ['author'],
      });
    }
  });

export const patchInsightResponseSchema = z.object({
  data: insightsSchema,
});

export const adminInsightListQuerySchema = z.object({
  ...pageQuerySchema.shape,
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  categoryId: idParamSchema.optional(),
});

export type CreateInsightPayload = z.infer<typeof createInsightBodySchema>;
export type PatchInsightPayload = z.infer<typeof patchInsightBodySchema>;
export type PartialInsightLocaleContent = z.infer<
  typeof partialInsightLocaleContentSchema
>;
