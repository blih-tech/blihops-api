import { errorResponse, requestBody } from '../../../shared/openapi/common.js';
import { registry } from '../../../shared/openapi/registry.js';
import {
  putServicesHeroBodySchema,
  putServicesHeroResponseSchema,
} from '../admin/services-hero/servicesHero.schema.js';
import {
  getServicesHeroResponseSchema,
  servicesHeroSchema,
} from './servicesHero.schema.js';

registry.register('ServicesHero', servicesHeroSchema);
registry.register('GetServicesHeroResponse', getServicesHeroResponseSchema);
registry.register('PutServicesHeroBody', putServicesHeroBodySchema);
registry.register('PutServicesHeroResponse', putServicesHeroResponseSchema);

const cookieSecurity = [{ apiKeyCookie: [] }];

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/services-hero',
  description:
    'Public. Returns the global Services hero media singleton, or null when it has not been configured yet.',
  tags: ['Content'],
  responses: {
    200: {
      description: 'Services hero media',
      content: {
        'application/json': { schema: getServicesHeroResponseSchema },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/admin/services-hero',
  description: 'Admin-only. Returns the global Services hero media singleton.',
  tags: ['Content'],
  security: cookieSecurity,
  responses: {
    200: {
      description: 'Services hero media',
      content: {
        'application/json': { schema: getServicesHeroResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/content/admin/services-hero',
  description:
    'Admin-only. Replaces the global Services hero media singleton (upsert on the fixed id "global").',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    body: requestBody(putServicesHeroBodySchema),
  },
  responses: {
    200: {
      description: 'Services hero media replaced',
      content: {
        'application/json': { schema: putServicesHeroResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    422: errorResponse('Validation failed'),
  },
});
