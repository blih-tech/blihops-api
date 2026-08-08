import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import {
  altTextSchema,
  idParamSchema,
  mediaUrlSchema,
} from '../../common/schemas.js';
import {
  getLogosResponseSchema,
  logosSchema,
} from '../../logos/logo.schema.js';

extendZodWithOpenApi(z);

export { getLogosResponseSchema };

export const createLogoBodySchema = z.object({
  imageUrl: mediaUrlSchema,
  alt: altTextSchema,
});

export const createLogoResponseSchema = z.object({
  data: logosSchema,
});

export const updateLogoParamsSchema = z.object({
  id: idParamSchema,
});

export const updateLogoBodySchema = z
  .object({
    imageUrl: mediaUrlSchema.optional(),
    alt: altTextSchema.optional(),
  })
  .refine((data) => data.imageUrl !== undefined || data.alt !== undefined, {
    message: 'At least one of imageUrl or alt is required',
    path: ['imageUrl'],
  })
  .describe('At least one of imageUrl or alt is required');

export const updateLogoResponseSchema = z.object({
  data: logosSchema,
});

export const deleteLogoParamsSchema = z.object({
  id: idParamSchema,
});
