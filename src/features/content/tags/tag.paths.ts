import { errorResponse, requestBody } from '../../../shared/openapi/common.js';
import { registry } from '../../../shared/openapi/registry.js';
import {
  createTagBodySchema,
  createTagResponseSchema,
  deleteTagParamsSchema,
  updateTagBodySchema,
  updateTagParamsSchema,
  updateTagResponseSchema,
} from '../admin/tags/tag.schema.js';
import { getTagsResponseSchema, tagsSchema } from './tag.schema.js';

registry.register('Tag', tagsSchema);
registry.register('GetTagsResponse', getTagsResponseSchema);
registry.register('CreateTagBody', createTagBodySchema);
registry.register('CreateTagResponse', createTagResponseSchema);
registry.register('UpdateTagParams', updateTagParamsSchema);
registry.register('UpdateTagBody', updateTagBodySchema);
registry.register('UpdateTagResponse', updateTagResponseSchema);
registry.register('DeleteTagParams', deleteTagParamsSchema);

const cookieSecurity = [{ apiKeyCookie: [] }];

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/tags',
  description: 'Public. Lists all tags sorted by name.',
  tags: ['Content'],
  responses: {
    200: {
      description: 'Tags list',
      content: { 'application/json': { schema: getTagsResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/admin/tags',
  description: 'Admin-only. Lists all tags sorted by name.',
  tags: ['Content'],
  security: cookieSecurity,
  responses: {
    200: {
      description: 'Tags list',
      content: { 'application/json': { schema: getTagsResponseSchema } },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/content/admin/tags',
  description: 'Admin-only. Creates a tag.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    body: requestBody(createTagBodySchema),
  },
  responses: {
    201: {
      description: 'Tag created',
      content: { 'application/json': { schema: createTagResponseSchema } },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    409: errorResponse('A tag with this name already exists'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/content/admin/tags/{id}',
  description: 'Admin-only. Renames a tag.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: updateTagParamsSchema,
    body: requestBody(updateTagBodySchema),
  },
  responses: {
    200: {
      description: 'Tag updated',
      content: { 'application/json': { schema: updateTagResponseSchema } },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Tag not found'),
    409: errorResponse('A tag with this name already exists'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/content/admin/tags/{id}',
  description: 'Admin-only. Deletes a tag.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: deleteTagParamsSchema,
  },
  responses: {
    204: { description: 'Tag deleted (no content)' },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Tag not found'),
    422: errorResponse('Validation failed'),
  },
});
