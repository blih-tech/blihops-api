import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { idParamSchema } from '../../common/schemas.js';
import { faqsSchema, getFaqsResponseSchema } from '../../faqs/faq.schema.js';

extendZodWithOpenApi(z);

export { getFaqsResponseSchema };

export const faqIdParamsSchema = z.object({
  id: idParamSchema,
});

export const faqQuestionSchema = z
  .string()
  .trim()
  .min(1, 'Question is required')
  .max(500, 'Keep the question under 500 characters');

export const faqAnswerSchema = z
  .string()
  .trim()
  .min(1, 'Answer is required')
  .max(4000, 'Keep the answer under 4000 characters');

export const faqLocaleContentSchema = z.object({
  question: faqQuestionSchema,
  answer: faqAnswerSchema,
});

export const displayOrderSchema = z
  .number()
  .int()
  .min(0, 'Display order must be zero or greater');

export const createFaqBodySchema = z.object({
  en: faqLocaleContentSchema,
  de: faqLocaleContentSchema,
  displayOrder: displayOrderSchema,
});

export const createFaqResponseSchema = z.object({
  data: faqsSchema,
});

export const patchFaqBodySchema = z
  .strictObject({
    en: faqLocaleContentSchema.optional(),
    de: faqLocaleContentSchema.optional(),
    displayOrder: displayOrderSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'At least one field is required',
        path: ['en'],
      });
    }
  });

export const patchFaqResponseSchema = z.object({
  data: faqsSchema,
});

export type CreateFaqPayload = z.infer<typeof createFaqBodySchema>;
export type PatchFaqPayload = z.infer<typeof patchFaqBodySchema>;
