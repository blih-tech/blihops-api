import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const completionTokenParamsSchema = z.object({
  token: z.string().min(10).max(200),
});

export const submitCompletionBodySchema = z.strictObject({
  photoFileKey: z.string().trim().min(1, 'Photo is required').max(500),
  shortBio: z
    .string()
    .trim()
    .min(10, 'Bio is too short')
    .max(1000, 'Keep bio under 1000 characters'),
  professionalHeadline: z
    .string()
    .trim()
    .min(2, 'Headline is required')
    .max(120),
});

export const completionInfoResponseSchema = z.object({
  data: z.object({
    applicationId: z.string(),
    fullName: z.string(),
    workEmail: z.string(),
    expiresAt: z.string(),
  }),
});

export const completionSubmitResponseSchema = z.object({
  data: z.object({
    applicationId: z.string(),
    status: z.string(),
  }),
});

export type SubmitCompletionPayload = z.infer<
  typeof submitCompletionBodySchema
>;
