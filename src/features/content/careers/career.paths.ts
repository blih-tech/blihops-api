import {
  errorResponse,
  registerPublicPath,
  requestBody,
} from '../../../shared/openapi/common.js';
import { registry } from '../../../shared/openapi/registry.js';
import {
  adminCareerListQuerySchema,
  careerIdParamsSchema,
  createCareerBodySchema,
  createCareerResponseSchema,
  getCareerDetailResponseSchema,
  getCareersResponseSchema,
  patchCareerBodySchema,
  patchCareerResponseSchema,
} from '../admin/careers/career.schema.js';
import {
  careerListItemSchema,
  careerListQuerySchema,
  careerSlugParamsSchema,
  careersSchema,
} from './career.schema.js';

registry.register('Career', careersSchema);
registry.register('CareerListItem', careerListItemSchema);
registry.register('GetCareersResponse', getCareersResponseSchema);
registry.register('GetCareerDetailResponse', getCareerDetailResponseSchema);
registry.register('CareerListQuery', careerListQuerySchema);
registry.register('CareerSlugParams', careerSlugParamsSchema);
registry.register('CreateCareerBody', createCareerBodySchema);
registry.register('CreateCareerResponse', createCareerResponseSchema);
registry.register('CareerIdParams', careerIdParamsSchema);
registry.register('PatchCareerBody', patchCareerBodySchema);
registry.register('PatchCareerResponse', patchCareerResponseSchema);
registry.register('AdminCareerListQuery', adminCareerListQuerySchema);

registerPublicPath('/api/v1/content/careers');
registerPublicPath('/api/v1/content/careers/{slug}');

const cookieSecurity = [{ apiKeyCookie: [] }];

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/careers',
  description:
    'Public. Lists active career roles, newest first, with trimmed list fields.',
  tags: ['Content'],
  request: {
    query: careerListQuerySchema,
  },
  responses: {
    200: {
      description: 'Career roles list',
      content: { 'application/json': { schema: getCareersResponseSchema } },
    },
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/careers/{slug}',
  description: 'Public. Returns one active career role with all fields.',
  tags: ['Content'],
  request: {
    params: careerSlugParamsSchema,
  },
  responses: {
    200: {
      description: 'Career role detail',
      content: {
        'application/json': { schema: getCareerDetailResponseSchema },
      },
    },
    404: errorResponse('Career role not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/admin/careers',
  description:
    'Admin-only. Lists all career roles with an optional isActive filter.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    query: adminCareerListQuerySchema,
  },
  responses: {
    200: {
      description: 'Career roles list',
      content: { 'application/json': { schema: getCareersResponseSchema } },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/admin/careers/{id}',
  description: 'Admin-only. Returns one career role with all fields.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: careerIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Career role detail',
      content: {
        'application/json': { schema: getCareerDetailResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Career role not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/content/admin/careers',
  description:
    'Admin-only. Creates an inactive career role. All fields are required.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    body: requestBody(createCareerBodySchema),
  },
  responses: {
    201: {
      description: 'Career role created',
      content: {
        'application/json': { schema: createCareerResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    409: errorResponse('A career role with this slug already exists'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/content/admin/careers/{id}',
  description:
    'Admin-only. Updates career role fields, including the isActive toggle.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: careerIdParamsSchema,
    body: requestBody(patchCareerBodySchema),
  },
  responses: {
    200: {
      description: 'Career role updated',
      content: { 'application/json': { schema: patchCareerResponseSchema } },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Career role not found'),
    409: errorResponse('A career role with this slug already exists'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/content/admin/careers/{id}',
  description: 'Admin-only. Deletes a career role.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: careerIdParamsSchema,
  },
  responses: {
    204: { description: 'Career role deleted (no content)' },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Career role not found'),
    422: errorResponse('Validation failed'),
  },
});
