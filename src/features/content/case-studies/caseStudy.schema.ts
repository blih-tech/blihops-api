import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { mediaSchema, metaSchema, pageQuerySchema } from '../common/schemas.js';

extendZodWithOpenApi(z);

export { mediaSchema };

export const caseStudyBodySchema = z.object({
  challenge: z.string(),
  approach: z.string(),
  outcome: z.string(),
});

export const localeContentSchema = z.object({
  title: z.string(),
  slug: z.string(),
  summary: z.string(),
  body: caseStudyBodySchema,
});

export const caseStudyContentSchema = z.object({
  en: localeContentSchema,
  de: localeContentSchema,
});

export const caseStudyTagSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const caseStudyCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const caseStudiesSchema = z.object({
  id: z.string(),
  client: z.string(),
  category: caseStudyCategorySchema.nullable(),
  media: mediaSchema,
  status: z.enum(['DRAFT', 'PUBLISHED']),
  tags: z.array(caseStudyTagSchema),
  content: caseStudyContentSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const caseStudyListItemSchema = z.object({
  id: z.string(),
  slugs: z.object({ en: z.string(), de: z.string() }),
  titles: z.object({ en: z.string(), de: z.string() }),
  summaries: z.object({ en: z.string(), de: z.string() }),
  client: z.string(),
  category: caseStudyCategorySchema.nullable(),
  media: mediaSchema,
  tags: z.array(caseStudyTagSchema),
  createdAt: z.string(),
});

export const getCaseStudiesResponseSchema = z.object({
  items: z.array(caseStudyListItemSchema),
  meta: metaSchema,
});

export const getCaseStudyDetailResponseSchema = z.object({
  data: caseStudiesSchema,
});

export const caseStudyListQuerySchema = pageQuerySchema;

export const caseStudySlugParamsSchema = z.object({
  slug: z.string().min(1).max(100),
});

export type CaseStudyLocaleContent = {
  title: string;
  slug: string;
  summary: string;
  body: { challenge: string; approach: string; outcome: string };
};

export type CaseStudyContent = {
  en?: CaseStudyLocaleContent;
  de?: CaseStudyLocaleContent;
};

export type CaseStudyDetail = {
  id: string;
  client: string;
  category: { id: string; name: string } | null;
  media: { type: 'image' | 'video'; url: string; alt?: string };
  status: 'DRAFT' | 'PUBLISHED';
  tags: { id: string; name: string }[];
  content: CaseStudyContent;
  createdAt: string;
  updatedAt: string;
};

export type CaseStudyListItem = z.infer<typeof caseStudyListItemSchema>;
