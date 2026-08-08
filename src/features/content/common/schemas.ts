import { z } from 'zod';

export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Keep the name under 100 characters');

export const idParamSchema = z.string().min(1, 'Id is required').max(50);

export const metaSchema = z.record(z.string(), z.unknown());

export const mediaUrlSchema = z
  .url('Enter a valid URL')
  .max(2048, 'Keep the URL under 2048 characters');

export const mediaSchema = z.object({
  type: z.enum(['image', 'video']),
  url: mediaUrlSchema,
  alt: z.string().trim().max(160).optional(),
});

export const altTextSchema = z
  .string()
  .trim()
  .min(1, 'Alt text is required')
  .max(160, 'Keep the alt text under 160 characters');

export const shortTextSchema = z
  .string()
  .trim()
  .min(1, 'Text is required')
  .max(100, 'Keep the text under 100 characters');

export const longTextSchema = z
  .string()
  .trim()
  .min(1, 'Text is required')
  .max(2000, 'Keep the text under 2000 characters');

export const slugSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Use lowercase letters, numbers, and hyphens',
  )
  .max(100, 'Keep the slug under 100 characters');

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(12).optional(),
});
