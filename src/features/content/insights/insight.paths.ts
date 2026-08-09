import {
  errorResponse,
  registerPublicPath,
  requestBody,
} from '../../../shared/openapi/common.js';
import { registry } from '../../../shared/openapi/registry.js';
import {
  adminInsightListQuerySchema,
  createInsightBodySchema,
  createInsightResponseSchema,
  getInsightDetailResponseSchema,
  getInsightsResponseSchema,
  insightIdParamsSchema,
  patchInsightBodySchema,
  patchInsightResponseSchema,
} from '../admin/insights/insight.schema.js';
import {
  insightCategorySchema,
  insightContentSchema,
  insightListItemSchema,
  insightListQuerySchema,
  insightLocaleContentSchema,
  insightSectionSchema,
  insightSlugParamsSchema,
  insightTagSchema,
  insightsSchema,
  mediaSchema,
} from './insight.schema.js';

registry.register('Media', mediaSchema);
registry.register('InsightSection', insightSectionSchema);
registry.register('InsightLocaleContent', insightLocaleContentSchema);
registry.register('InsightContent', insightContentSchema);
registry.register('InsightTag', insightTagSchema);
registry.register('InsightCategory', insightCategorySchema);
registry.register('Insight', insightsSchema);
registry.register('InsightListItem', insightListItemSchema);
registry.register('GetInsightsResponse', getInsightsResponseSchema);
registry.register('GetInsightDetailResponse', getInsightDetailResponseSchema);
registry.register('InsightListQuery', insightListQuerySchema);
registry.register('InsightSlugParams', insightSlugParamsSchema);
registry.register('CreateInsightBody', createInsightBodySchema);
registry.register('CreateInsightResponse', createInsightResponseSchema);
registry.register('InsightIdParams', insightIdParamsSchema);
registry.register('PatchInsightBody', patchInsightBodySchema);
registry.register('PatchInsightResponse', patchInsightResponseSchema);
registry.register('AdminInsightListQuery', adminInsightListQuerySchema);

registerPublicPath('/api/v1/content/insights');
registerPublicPath('/api/v1/content/insights/{slug}');

const cookieSecurity = [{ apiKeyCookie: [] }];

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/insights',
  description:
    'Public. Lists published insights, newest first, with both locales.',
  tags: ['Content'],
  request: {
    query: insightListQuerySchema,
  },
  responses: {
    200: {
      description: 'Insights list',
      content: { 'application/json': { schema: getInsightsResponseSchema } },
    },
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/insights/{slug}',
  description:
    'Public. Returns one published insight; the slug may match either locale. Returns both locales.',
  tags: ['Content'],
  request: {
    params: insightSlugParamsSchema,
  },
  responses: {
    200: {
      description: 'Insight detail',
      content: {
        'application/json': { schema: getInsightDetailResponseSchema },
      },
    },
    404: errorResponse('Insight not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/admin/insights',
  description:
    'Admin-only. Lists all insights with optional status and category filters.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    query: adminInsightListQuerySchema,
  },
  responses: {
    200: {
      description: 'Insights list',
      content: { 'application/json': { schema: getInsightsResponseSchema } },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/admin/insights/{id}',
  description:
    'Admin-only. Returns one insight with both locales, category, and tags.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: insightIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Insight detail',
      content: {
        'application/json': { schema: getInsightDetailResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Insight not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/content/admin/insights',
  description:
    'Admin-only. Creates a DRAFT insight. Author is required; all other fields are optional.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    body: requestBody(createInsightBodySchema),
  },
  responses: {
    201: {
      description: 'Insight created',
      content: {
        'application/json': { schema: createInsightResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('One or more tags were not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/content/admin/insights/{id}',
  description:
    'Admin-only. Updates shared fields (author, categoryId, media, tags, readTimeMinutes) or replaces one locale content object. Changes apply live, even to published records.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: insightIdParamsSchema,
    body: requestBody(patchInsightBodySchema),
  },
  responses: {
    200: {
      description: 'Insight updated',
      content: { 'application/json': { schema: patchInsightResponseSchema } },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Insight not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/content/admin/insights/{id}/publish',
  description:
    'Admin-only. Validates both locales and shared fields, checks slug uniqueness, then publishes.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: insightIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Insight published',
      content: {
        'application/json': { schema: getInsightDetailResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Insight not found'),
    422: errorResponse('Publish validation failed'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/content/admin/insights/{id}/unpublish',
  description: 'Admin-only. Flips an insight back to DRAFT.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: insightIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Insight unpublished',
      content: {
        'application/json': { schema: getInsightDetailResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Insight not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/content/admin/insights/{id}',
  description: 'Admin-only. Deletes an insight and its tag assignments.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: insightIdParamsSchema,
  },
  responses: {
    204: { description: 'Insight deleted (no content)' },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Insight not found'),
    422: errorResponse('Validation failed'),
  },
});
