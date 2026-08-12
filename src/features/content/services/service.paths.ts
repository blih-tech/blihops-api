import {
  errorResponse,
  registerPublicPath,
  requestBody,
} from '../../../shared/openapi/common.js';
import { registry } from '../../../shared/openapi/registry.js';
import {
  createServiceBodySchema,
  createServiceResponseSchema,
  patchServiceBodySchema,
  patchServiceResponseSchema,
  serviceIdParamsSchema,
} from '../admin/services/service.schema.js';
import {
  getServicesResponseSchema,
  serviceContentSchema,
  serviceLocaleContentSchema,
  servicesSchema,
} from './service.schema.js';

registry.register('ServiceLocaleContent', serviceLocaleContentSchema);
registry.register('ServiceContent', serviceContentSchema);
registry.register('Service', servicesSchema);
registry.register('GetServicesResponse', getServicesResponseSchema);
registry.register('ServiceIdParams', serviceIdParamsSchema);
registry.register('CreateServiceBody', createServiceBodySchema);
registry.register('CreateServiceResponse', createServiceResponseSchema);
registry.register('PatchServiceBody', patchServiceBodySchema);
registry.register('PatchServiceResponse', patchServiceResponseSchema);

registerPublicPath('/api/v1/content/services');

const cookieSecurity = [{ apiKeyCookie: [] }];

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/services',
  description:
    'Public. Lists all services in display order. Services are always live; both locales are embedded and the web selects by its active locale.',
  tags: ['Content'],
  responses: {
    200: {
      description: 'Services list',
      content: {
        'application/json': { schema: getServicesResponseSchema },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/admin/services',
  description:
    'Admin-only. Lists all services in display order. Identical to the public list — services have no status to filter.',
  tags: ['Content'],
  security: cookieSecurity,
  responses: {
    200: {
      description: 'Services list',
      content: {
        'application/json': { schema: getServicesResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/admin/services/{id}',
  description: 'Admin-only. Returns one service with all fields.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: serviceIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Service detail',
      content: {
        'application/json': { schema: patchServiceResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Service not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/content/admin/services',
  description:
    'Admin-only. Creates a service that goes live immediately. Both locales and all shared fields are required; displayOrder defaults to the end of the list. Slugs must be unique.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    body: requestBody(createServiceBodySchema),
  },
  responses: {
    201: {
      description: 'Service created',
      content: {
        'application/json': { schema: createServiceResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    409: errorResponse('A service with this slug already exists'),
    422: errorResponse('Validation failed or service incomplete'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/content/admin/services/{id}',
  description:
    'Admin-only. Updates shared fields, or one locale via `locale` + `content`. The merged record must stay complete — services are always live.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: serviceIdParamsSchema,
    body: requestBody(patchServiceBodySchema),
  },
  responses: {
    200: {
      description: 'Service updated',
      content: {
        'application/json': { schema: patchServiceResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Service not found'),
    409: errorResponse('A service with this slug already exists'),
    422: errorResponse('Validation failed or service would be incomplete'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/content/admin/services/{id}',
  description: 'Admin-only. Deletes a service.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: serviceIdParamsSchema,
  },
  responses: {
    204: { description: 'Service deleted (no content)' },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Service not found'),
    422: errorResponse('Validation failed'),
  },
});
