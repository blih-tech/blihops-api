import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import {
  idParamSchema,
  mediaSchema,
  pageQuerySchema,
  slugSchema,
} from '../../common/schemas.js';
import {
  caseStudyCategorySchema,
  caseStudiesSchema,
  getCaseStudyDetailResponseSchema,
  getCaseStudiesResponseSchema,
} from '../../case-studies/caseStudy.schema.js';

extendZodWithOpenApi(z);

export { getCaseStudyDetailResponseSchema, getCaseStudiesResponseSchema };

export const caseStudyIdParamsSchema = z.object({
  id: idParamSchema,
});

export const clientSchema = z
  .string()
  .trim()
  .min(1, 'Client is required')
  .max(200, 'Keep the client name under 200 characters');

export const partialLocaleContentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Keep the title under 200 characters')
    .optional(),
  slug: slugSchema.optional(),
  summary: z
    .string()
    .trim()
    .min(1, 'Summary is required')
    .max(500, 'Keep the summary under 500 characters')
    .optional(),
  body: z
    .object({
      challenge: z.string().max(200_000).optional(),
      approach: z.string().max(200_000).optional(),
      outcome: z.string().max(200_000).optional(),
    })
    .optional(),
});

export const fullLocaleContentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Keep the title under 200 characters'),
  slug: slugSchema,
  summary: z
    .string()
    .trim()
    .min(1, 'Summary is required')
    .max(500, 'Keep the summary under 500 characters'),
  body: z.object({
    challenge: z.string().trim().min(1, 'Challenge section is required'),
    approach: z.string().trim().min(1, 'Approach section is required'),
    outcome: z.string().trim().min(1, 'Outcome section is required'),
  }),
});

export const createCaseStudyBodySchema = z.object({
  client: clientSchema,
  categoryId: idParamSchema.nullable().optional(),
  media: mediaSchema.optional(),
  tags: z.array(idParamSchema).optional(),
  content: z
    .object({
      en: partialLocaleContentSchema.optional(),
      de: partialLocaleContentSchema.optional(),
    })
    .optional(),
});

export const createCaseStudyResponseSchema = z.object({
  data: caseStudiesSchema,
});

const sharedFieldsPatchSchema = z.strictObject({
  client: clientSchema.optional(),
  categoryId: idParamSchema.nullable().optional(),
  media: mediaSchema.optional(),
  tags: z.array(idParamSchema).optional(),
});

const localePatchSchema = z.strictObject({
  locale: z.string().min(1).max(2).describe('Locale to replace: en or de'),
  content: partialLocaleContentSchema,
});

export const patchCaseStudyBodySchema = z
  .union([sharedFieldsPatchSchema, localePatchSchema])
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'At least one field is required',
        path: ['client'],
      });
    }
  });

export const patchCaseStudyResponseSchema = z.object({
  data: caseStudiesSchema,
});

export const adminCaseStudyListQuerySchema = z.object({
  ...pageQuerySchema.shape,
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  categoryId: idParamSchema.optional(),
});

export type CreateCaseStudyPayload = z.infer<typeof createCaseStudyBodySchema>;
export type PatchCaseStudyPayload = z.infer<typeof patchCaseStudyBodySchema>;
export type PartialLocaleContent = z.infer<typeof partialLocaleContentSchema>;
export type CategoryRef = z.infer<typeof caseStudyCategorySchema>;
