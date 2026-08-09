import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { metaSchema } from '../common/schemas.js';

extendZodWithOpenApi(z);

export const faqLocaleContentSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const faqContentSchema = z.object({
  en: faqLocaleContentSchema,
  de: faqLocaleContentSchema,
});

export const faqsSchema = z.object({
  id: z.string(),
  isActive: z.boolean(),
  displayOrder: z.number(),
  content: faqContentSchema,
});

export const getFaqsResponseSchema = z.object({
  items: z.array(faqsSchema),
  meta: metaSchema,
});

export type FaqLocaleContent = {
  question: string;
  answer: string;
};

export type FaqContent = {
  en?: FaqLocaleContent;
  de?: FaqLocaleContent;
};

export type FaqDetail = {
  id: string;
  isActive: boolean;
  displayOrder: number;
  content: FaqContent;
};
