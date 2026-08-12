import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import {
  altTextSchema,
  idParamSchema,
  mediaUrlSchema,
  slugSchema,
} from '../../common/schemas.js';
import {
  getServicesResponseSchema,
  servicesSchema,
} from '../../services/service.schema.js';

extendZodWithOpenApi(z);

export { getServicesResponseSchema };

export const serviceIcons = [
  'headset',
  'files',
  'code',
  'bot',
  'chart-column',
  'globe',
  'shield-check',
  'database',
  'users',
  'sparkles',
] as const;

export const serviceIconSchema = z.enum(serviceIcons);

export const serviceIdParamsSchema = z.object({
  id: idParamSchema,
});

export const serviceTitleSchema = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(150, 'Keep the title under 150 characters');

export const serviceSubtitleSchema = z
  .string()
  .trim()
  .min(1, 'Subtitle is required')
  .max(300, 'Keep the subtitle under 300 characters');

export const serviceShortDescriptionSchema = z
  .string()
  .trim()
  .min(1, 'Short description is required')
  .max(300, 'Keep the short description under 300 characters');

export const serviceDetailsSchema = z
  .string()
  .trim()
  .min(1, 'Details are required')
  .max(500, 'Keep the details under 500 characters');

export const serviceTagSchema = z
  .string()
  .trim()
  .min(1, 'Tag is required')
  .max(80, 'Keep the tag under 80 characters');

export const serviceBodySchema = z
  .string()
  .trim()
  .min(1, 'Body is required')
  .max(5000, 'Keep the body under 5000 characters');

export const serviceFeaturesSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, 'Feature entries cannot be empty')
      .max(200, 'Keep features under 200 characters'),
  )
  .min(1, 'At least one feature is required')
  .max(10, 'Keep the feature list under 10 entries');

export const serviceWhoThisIsForSchema = z
  .string()
  .trim()
  .min(1, 'Who this is for is required')
  .max(500, 'Keep the text under 500 characters');

export const serviceDisplayOrderSchema = z
  .number()
  .int()
  .min(0, 'Display order must be zero or greater');

export const serviceAdminLocaleContentSchema = z.object({
  slug: slugSchema,
  title: serviceTitleSchema,
  subtitle: serviceSubtitleSchema,
  shortDescription: serviceShortDescriptionSchema,
  details: serviceDetailsSchema,
  tag: serviceTagSchema,
  body: serviceBodySchema,
  features: serviceFeaturesSchema,
  whoThisIsFor: serviceWhoThisIsForSchema,
});

export const createServiceBodySchema = z.object({
  icon: serviceIconSchema,
  imageUrl: mediaUrlSchema,
  alt: altTextSchema,
  displayOrder: serviceDisplayOrderSchema.optional(),
  content: z.object({
    en: serviceAdminLocaleContentSchema,
    de: serviceAdminLocaleContentSchema,
  }),
});

export const createServiceResponseSchema = z.object({
  data: servicesSchema,
});

export const patchServiceBodySchema = z
  .strictObject({
    icon: serviceIconSchema.optional(),
    imageUrl: mediaUrlSchema.optional(),
    alt: altTextSchema.optional(),
    displayOrder: serviceDisplayOrderSchema.optional(),
    locale: z.enum(['en', 'de']).optional(),
    content: serviceAdminLocaleContentSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'At least one field is required',
        path: ['icon'],
      });
    }
    if ((data.locale === undefined) !== (data.content === undefined)) {
      ctx.addIssue({
        code: 'custom',
        message: 'locale and content must be provided together',
        path: ['content'],
      });
    }
  });

export const patchServiceResponseSchema = z.object({
  data: servicesSchema,
});

export type ServiceAdminLocaleContent = z.infer<
  typeof serviceAdminLocaleContentSchema
>;
export type CreateServicePayload = z.infer<typeof createServiceBodySchema>;
export type PatchServicePayload = z.infer<typeof patchServiceBodySchema>;
