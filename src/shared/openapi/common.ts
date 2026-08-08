import { z } from 'zod';

export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z
      .array(
        z.object({
          path: z.string().optional(),
          message: z.string(),
        }),
      )
      .optional(),
  }),
});

export const mediaContent = (schema: z.ZodTypeAny) => ({
  'application/json': { schema },
});

export const requestBody = (schema: z.ZodTypeAny) => ({
  content: mediaContent(schema),
});

export const errorResponse = (description: string) => ({
  description,
  content: mediaContent(errorEnvelopeSchema),
});
