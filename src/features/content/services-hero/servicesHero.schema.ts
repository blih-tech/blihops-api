import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const servicesHeroSchema = z.object({
  id: z.string(),
  videoUrl: z.string(),
  coverUrl: z.string(),
  altLabel: z.string(),
  lastUpdatedAt: z.string(),
});

export const getServicesHeroResponseSchema = z.object({
  data: servicesHeroSchema.nullable(),
});

export type ServicesHeroResponse = z.infer<typeof servicesHeroSchema>;
