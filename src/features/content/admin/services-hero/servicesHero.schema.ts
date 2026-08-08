import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { altTextSchema, mediaUrlSchema } from '../../common/schemas.js';
import { servicesHeroSchema } from '../../services-hero/servicesHero.schema.js';

extendZodWithOpenApi(z);

export const putServicesHeroBodySchema = z.object({
  videoUrl: mediaUrlSchema,
  coverUrl: mediaUrlSchema,
  altLabel: altTextSchema,
});

export const putServicesHeroResponseSchema = z.object({
  data: servicesHeroSchema,
});
