import {
  errorResponse,
  registerPublicPath,
  requestBody,
} from '../../../shared/openapi/common.js';
import { registry } from '../../../shared/openapi/registry.js';
import {
  createCategoryBodySchema,
  createCategoryResponseSchema,
  deleteCategoryParamsSchema,
  updateCategoryBodySchema,
  updateCategoryParamsSchema,
  updateCategoryResponseSchema,
} from '../admin/categories/category.schema.js';
import {
  categoriesSchema,
  getCategoriesResponseSchema,
} from './category.schema.js';

registry.register('Category', categoriesSchema);
registry.register('GetCategoriesResponse', getCategoriesResponseSchema);
registry.register('CreateCategoryBody', createCategoryBodySchema);
registry.register('CreateCategoryResponse', createCategoryResponseSchema);
registry.register('UpdateCategoryParams', updateCategoryParamsSchema);
registry.register('UpdateCategoryBody', updateCategoryBodySchema);
registry.register('UpdateCategoryResponse', updateCategoryResponseSchema);
registry.register('DeleteCategoryParams', deleteCategoryParamsSchema);

registerPublicPath('/api/v1/content/categories');

const cookieSecurity = [{ apiKeyCookie: [] }];

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/categories',
  description: 'Public. Lists all categories sorted by name.',
  tags: ['Content'],
  responses: {
    200: {
      description: 'Categories list',
      content: { 'application/json': { schema: getCategoriesResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/admin/categories',
  description: 'Admin-only. Lists all categories sorted by name.',
  tags: ['Content'],
  security: cookieSecurity,
  responses: {
    200: {
      description: 'Categories list',
      content: { 'application/json': { schema: getCategoriesResponseSchema } },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/content/admin/categories',
  description: 'Admin-only. Creates a category.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    body: requestBody(createCategoryBodySchema),
  },
  responses: {
    201: {
      description: 'Category created',
      content: {
        'application/json': { schema: createCategoryResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    409: errorResponse('A category with this name already exists'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/content/admin/categories/{id}',
  description: 'Admin-only. Renames a category.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: updateCategoryParamsSchema,
    body: requestBody(updateCategoryBodySchema),
  },
  responses: {
    200: {
      description: 'Category updated',
      content: {
        'application/json': { schema: updateCategoryResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Category not found'),
    409: errorResponse('A category with this name already exists'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/content/admin/categories/{id}',
  description: 'Admin-only. Deletes a category.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: deleteCategoryParamsSchema,
  },
  responses: {
    204: { description: 'Category deleted (no content)' },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Category not found'),
    422: errorResponse('Validation failed'),
  },
});
