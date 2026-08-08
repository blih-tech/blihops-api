import { errorResponse, requestBody } from '../../../shared/openapi/common.js';
import { registry } from '../../../shared/openapi/registry.js';
import {
  createLogoBodySchema,
  createLogoResponseSchema,
  deleteLogoParamsSchema,
  updateLogoBodySchema,
  updateLogoParamsSchema,
  updateLogoResponseSchema,
} from '../admin/logos/logo.schema.js';
import { getLogosResponseSchema, logosSchema } from './logo.schema.js';

registry.register('Logo', logosSchema);
registry.register('GetLogosResponse', getLogosResponseSchema);
registry.register('CreateLogoBody', createLogoBodySchema);
registry.register('CreateLogoResponse', createLogoResponseSchema);
registry.register('UpdateLogoParams', updateLogoParamsSchema);
registry.register('UpdateLogoBody', updateLogoBodySchema);
registry.register('UpdateLogoResponse', updateLogoResponseSchema);
registry.register('DeleteLogoParams', deleteLogoParamsSchema);

const cookieSecurity = [{ apiKeyCookie: [] }];

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/logos',
  description: 'Public. Lists all trusted logos in creation order.',
  tags: ['Content'],
  responses: {
    200: {
      description: 'Logos list',
      content: { 'application/json': { schema: getLogosResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/admin/logos',
  description: 'Admin-only. Lists all trusted logos in creation order.',
  tags: ['Content'],
  security: cookieSecurity,
  responses: {
    200: {
      description: 'Logos list',
      content: { 'application/json': { schema: getLogosResponseSchema } },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/content/admin/logos',
  description: 'Admin-only. Creates a trusted logo.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    body: requestBody(createLogoBodySchema),
  },
  responses: {
    201: {
      description: 'Logo created',
      content: { 'application/json': { schema: createLogoResponseSchema } },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/content/admin/logos/{id}',
  description: 'Admin-only. Updates the image URL and/or alt text of a logo.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: updateLogoParamsSchema,
    body: requestBody(updateLogoBodySchema),
  },
  responses: {
    200: {
      description: 'Logo updated',
      content: { 'application/json': { schema: updateLogoResponseSchema } },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Logo not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/content/admin/logos/{id}',
  description: 'Admin-only. Deletes a trusted logo.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: deleteLogoParamsSchema,
  },
  responses: {
    204: { description: 'Logo deleted (no content)' },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Logo not found'),
    422: errorResponse('Validation failed'),
  },
});
