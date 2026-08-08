import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { mediaSchema, metaSchema, pageQuerySchema } from '../common/schemas.js';

extendZodWithOpenApi(z);

export { mediaSchema };

export const insightSectionSchema = z.object({
  section: z.string(),
  content: z.string(),
});

export const insightLocaleContentSchema = z.object({
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  body: z.array(insightSectionSchema),
});

export const insightContentSchema = z.object({
  en: insightLocaleContentSchema,
  de: insightLocaleContentSchema,
});

export const insightTagSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const insightCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const insightsSchema = z.object({
  id: z.string(),
  author: z.string(),
  category: insightCategorySchema.nullable(),
  media: mediaSchema,
  status: z.enum(['DRAFT', 'PUBLISHED']),
  tags: z.array(insightTagSchema),
  content: insightContentSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const insightListItemSchema = z.object({
  id: z.string(),
  slugs: z.object({ en: z.string(), de: z.string() }),
  titles: z.object({ en: z.string(), de: z.string() }),
  excerpts: z.object({ en: z.string(), de: z.string() }),
  author: z.string(),
  category: insightCategorySchema.nullable(),
  media: mediaSchema,
  tags: z.array(insightTagSchema),
  createdAt: z.string(),
});

export const getInsightsResponseSchema = z.object({
  items: z.array(insightListItemSchema),
  meta: metaSchema,
});

export const getInsightDetailResponseSchema = z.object({
  data: insightsSchema,
});

export const insightListQuerySchema = pageQuerySchema;

export const insightSlugParamsSchema = z.object({
  slug: z.string().min(1).max(100),
});

export type InsightLocaleContent = {
  title: string;
  slug: string;
  excerpt: string;
  body: { section: string; content: string }[];
};

export type InsightContent = {
  en?: InsightLocaleContent;
  de?: InsightLocaleContent;
};

export type InsightDetail = {
  id: string;
  author: string;
  category: { id: string; name: string } | null;
  media: { type: 'image' | 'video'; url: string; alt?: string };
  status: 'DRAFT' | 'PUBLISHED';
  tags: { id: string; name: string }[];
  content: InsightContent;
  createdAt: string;
  updatedAt: string;
};

export type InsightListItem = z.infer<typeof insightListItemSchema>;
