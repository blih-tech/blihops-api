import {
  errorResponse,
  registerPublicPath,
  requestBody,
} from '../../../shared/openapi/common.js';
import { registry } from '../../../shared/openapi/registry.js';
import {
  createFaqBodySchema,
  createFaqResponseSchema,
  faqIdParamsSchema,
  getFaqsResponseSchema,
  patchFaqBodySchema,
  patchFaqResponseSchema,
} from '../admin/faqs/faq.schema.js';
import {
  faqContentSchema,
  faqLocaleContentSchema,
  faqsSchema,
} from './faq.schema.js';

registry.register('FaqLocaleContent', faqLocaleContentSchema);
registry.register('FaqContent', faqContentSchema);
registry.register('Faq', faqsSchema);
registry.register('GetFaqsResponse', getFaqsResponseSchema);
registry.register('CreateFaqBody', createFaqBodySchema);
registry.register('CreateFaqResponse', createFaqResponseSchema);
registry.register('FaqIdParams', faqIdParamsSchema);
registry.register('PatchFaqBody', patchFaqBodySchema);
registry.register('PatchFaqResponse', patchFaqResponseSchema);

registerPublicPath('/api/v1/content/faqs');

const cookieSecurity = [{ apiKeyCookie: [] }];

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/faqs',
  description: 'Public. Lists active FAQs in display order, with both locales.',
  tags: ['Content'],
  responses: {
    200: {
      description: 'FAQs list',
      content: { 'application/json': { schema: getFaqsResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/admin/faqs',
  description: 'Admin-only. Lists all FAQs in display order.',
  tags: ['Content'],
  security: cookieSecurity,
  responses: {
    200: {
      description: 'FAQs list',
      content: { 'application/json': { schema: getFaqsResponseSchema } },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/admin/faqs/{id}',
  description: 'Admin-only. Returns one FAQ.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: faqIdParamsSchema,
  },
  responses: {
    200: {
      description: 'FAQ detail',
      content: { 'application/json': { schema: getFaqsResponseSchema } },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('FAQ not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/content/admin/faqs',
  description:
    'Admin-only. Creates an inactive FAQ. Both locales and displayOrder are required.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    body: requestBody(createFaqBodySchema),
  },
  responses: {
    201: {
      description: 'FAQ created',
      content: { 'application/json': { schema: createFaqResponseSchema } },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/content/admin/faqs/{id}',
  description:
    'Admin-only. Updates FAQ fields, ordering, or the isActive toggle. Activating requires both locales to be complete.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: faqIdParamsSchema,
    body: requestBody(patchFaqBodySchema),
  },
  responses: {
    200: {
      description: 'FAQ updated',
      content: { 'application/json': { schema: patchFaqResponseSchema } },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('FAQ not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/content/admin/faqs/{id}',
  description: 'Admin-only. Deletes an FAQ.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: faqIdParamsSchema,
  },
  responses: {
    204: { description: 'FAQ deleted (no content)' },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('FAQ not found'),
    422: errorResponse('Validation failed'),
  },
});
