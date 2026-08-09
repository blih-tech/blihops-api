import {
  errorResponse,
  registerPublicPath,
  requestBody,
} from '../../../shared/openapi/common.js';
import { registry } from '../../../shared/openapi/registry.js';
import {
  createTestimonialBodySchema,
  createTestimonialResponseSchema,
  deleteTestimonialParamsSchema,
  updateTestimonialBodySchema,
  updateTestimonialParamsSchema,
  updateTestimonialResponseSchema,
} from '../admin/testimonials/testimonial.schema.js';
import {
  getTestimonialsResponseSchema,
  testimonialsSchema,
} from './testimonial.schema.js';

registry.register('Testimonial', testimonialsSchema);
registry.register('GetTestimonialsResponse', getTestimonialsResponseSchema);
registry.register('CreateTestimonialBody', createTestimonialBodySchema);
registry.register('CreateTestimonialResponse', createTestimonialResponseSchema);
registry.register('UpdateTestimonialParams', updateTestimonialParamsSchema);
registry.register('UpdateTestimonialBody', updateTestimonialBodySchema);
registry.register('UpdateTestimonialResponse', updateTestimonialResponseSchema);
registry.register('DeleteTestimonialParams', deleteTestimonialParamsSchema);

registerPublicPath('/api/v1/content/testimonials');

const cookieSecurity = [{ apiKeyCookie: [] }];

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/testimonials',
  description:
    'Public. Lists all testimonials in creation order, including the primary flag.',
  tags: ['Content'],
  responses: {
    200: {
      description: 'Testimonials list',
      content: {
        'application/json': { schema: getTestimonialsResponseSchema },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/admin/testimonials',
  description: 'Admin-only. Lists all testimonials in creation order.',
  tags: ['Content'],
  security: cookieSecurity,
  responses: {
    200: {
      description: 'Testimonials list',
      content: {
        'application/json': { schema: getTestimonialsResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/content/admin/testimonials',
  description: 'Admin-only. Creates a testimonial.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    body: requestBody(createTestimonialBodySchema),
  },
  responses: {
    201: {
      description: 'Testimonial created',
      content: {
        'application/json': { schema: createTestimonialResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/content/admin/testimonials/{id}',
  description:
    'Admin-only. Updates testimonial fields. Setting isPrimary to true clears the previous primary in a transaction.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: updateTestimonialParamsSchema,
    body: requestBody(updateTestimonialBodySchema),
  },
  responses: {
    200: {
      description: 'Testimonial updated',
      content: {
        'application/json': { schema: updateTestimonialResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Testimonial not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/content/admin/testimonials/{id}',
  description:
    'Admin-only. Deletes a testimonial. The current primary cannot be deleted until a replacement is set.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: deleteTestimonialParamsSchema,
  },
  responses: {
    204: { description: 'Testimonial deleted (no content)' },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Testimonial not found'),
    409: errorResponse(
      'The primary testimonial cannot be deleted until another testimonial is set as primary',
    ),
    422: errorResponse('Validation failed'),
  },
});
