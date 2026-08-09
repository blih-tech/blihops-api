import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { metaSchema, pageQuerySchema } from '../common/schemas.js';

extendZodWithOpenApi(z);

export const careersSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  department: z.string(),
  location: z.string(),
  employmentType: z.string(),
  summary: z.string(),
  overview: z.array(z.string()),
  responsibilities: z.array(z.string()),
  requirements: z.array(z.string()),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const careerListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  department: z.string(),
  location: z.string(),
  employmentType: z.string(),
  summary: z.string(),
  createdAt: z.string(),
});

export const getCareersResponseSchema = z.object({
  items: z.array(careerListItemSchema),
  meta: metaSchema,
});

export const getCareerDetailResponseSchema = z.object({
  data: careersSchema,
});

export const careerListQuerySchema = pageQuerySchema;

export const careerSlugParamsSchema = z.object({
  slug: z.string().min(1).max(100),
});

export type CareerDetail = {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  employmentType: string;
  summary: string;
  overview: string[];
  responsibilities: string[];
  requirements: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CareerListItem = z.infer<typeof careerListItemSchema>;
