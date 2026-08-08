import { errorResponse, requestBody } from '../../../shared/openapi/common.js';
import { registry } from '../../../shared/openapi/registry.js';
import {
  adminCaseStudyListQuerySchema,
  caseStudyIdParamsSchema,
  createCaseStudyBodySchema,
  createCaseStudyResponseSchema,
  getCaseStudyDetailResponseSchema,
  getCaseStudiesResponseSchema,
  patchCaseStudyBodySchema,
  patchCaseStudyResponseSchema,
} from '../admin/case-studies/caseStudy.schema.js';
import {
  caseStudyBodySchema,
  caseStudyCategorySchema,
  caseStudyContentSchema,
  caseStudyListItemSchema,
  caseStudyListQuerySchema,
  caseStudySlugParamsSchema,
  caseStudyTagSchema,
  caseStudiesSchema,
  localeContentSchema,
  mediaSchema,
} from './caseStudy.schema.js';

registry.register('Media', mediaSchema);
registry.register('CaseStudyBody', caseStudyBodySchema);
registry.register('LocaleContent', localeContentSchema);
registry.register('CaseStudyContent', caseStudyContentSchema);
registry.register('CaseStudyTag', caseStudyTagSchema);
registry.register('CaseStudyCategory', caseStudyCategorySchema);
registry.register('CaseStudy', caseStudiesSchema);
registry.register('CaseStudyListItem', caseStudyListItemSchema);
registry.register('GetCaseStudiesResponse', getCaseStudiesResponseSchema);
registry.register(
  'GetCaseStudyDetailResponse',
  getCaseStudyDetailResponseSchema,
);
registry.register('CaseStudyListQuery', caseStudyListQuerySchema);
registry.register('CaseStudySlugParams', caseStudySlugParamsSchema);
registry.register('CreateCaseStudyBody', createCaseStudyBodySchema);
registry.register('CreateCaseStudyResponse', createCaseStudyResponseSchema);
registry.register('CaseStudyIdParams', caseStudyIdParamsSchema);
registry.register('PatchCaseStudyBody', patchCaseStudyBodySchema);
registry.register('PatchCaseStudyResponse', patchCaseStudyResponseSchema);
registry.register('AdminCaseStudyListQuery', adminCaseStudyListQuerySchema);

const cookieSecurity = [{ apiKeyCookie: [] }];

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/case-studies',
  description:
    'Public. Lists published case studies, newest first, with both locales.',
  tags: ['Content'],
  request: {
    query: caseStudyListQuerySchema,
  },
  responses: {
    200: {
      description: 'Case studies list',
      content: {
        'application/json': { schema: getCaseStudiesResponseSchema },
      },
    },
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/case-studies/{slug}',
  description:
    'Public. Returns one published case study; the slug may match either locale. Returns both locales.',
  tags: ['Content'],
  request: {
    params: caseStudySlugParamsSchema,
  },
  responses: {
    200: {
      description: 'Case study detail',
      content: {
        'application/json': { schema: getCaseStudyDetailResponseSchema },
      },
    },
    404: errorResponse('Case study not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/admin/case-studies',
  description:
    'Admin-only. Lists all case studies with optional status and category filters.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    query: adminCaseStudyListQuerySchema,
  },
  responses: {
    200: {
      description: 'Case studies list',
      content: {
        'application/json': { schema: getCaseStudiesResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/content/admin/case-studies/{id}',
  description:
    'Admin-only. Returns one case study with both locales, category, and tags.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: caseStudyIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Case study detail',
      content: {
        'application/json': { schema: getCaseStudyDetailResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Case study not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/content/admin/case-studies',
  description:
    'Admin-only. Creates a DRAFT case study. Client is required; all other fields are optional.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    body: requestBody(createCaseStudyBodySchema),
  },
  responses: {
    201: {
      description: 'Case study created',
      content: {
        'application/json': { schema: createCaseStudyResponseSchema },
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
  path: '/api/v1/content/admin/case-studies/{id}',
  description:
    'Admin-only. Updates shared fields (client, categoryId, media, tags) or replaces one locale content object. Changes apply live, even to published records.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: caseStudyIdParamsSchema,
    body: requestBody(patchCaseStudyBodySchema),
  },
  responses: {
    200: {
      description: 'Case study updated',
      content: {
        'application/json': { schema: patchCaseStudyResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Case study not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/content/admin/case-studies/{id}/publish',
  description:
    'Admin-only. Validates both locales and shared fields, checks slug uniqueness, then publishes.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: caseStudyIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Case study published',
      content: {
        'application/json': { schema: getCaseStudyDetailResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Case study not found'),
    422: errorResponse('Publish validation failed'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/content/admin/case-studies/{id}/unpublish',
  description: 'Admin-only. Flips a case study back to DRAFT.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: caseStudyIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Case study unpublished',
      content: {
        'application/json': { schema: getCaseStudyDetailResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Case study not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/content/admin/case-studies/{id}',
  description: 'Admin-only. Deletes a case study and its tag assignments.',
  tags: ['Content'],
  security: cookieSecurity,
  request: {
    params: caseStudyIdParamsSchema,
  },
  responses: {
    204: { description: 'Case study deleted (no content)' },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Case study not found'),
    422: errorResponse('Validation failed'),
  },
});
