import {
  errorResponse,
  registerPublicPath,
  requestBody,
} from '../../../shared/openapi/common.js';
import { registry } from '../../../shared/openapi/registry.js';
import {
  createTalentApplicationBodySchema,
  patchTalentApplicationNotesBodySchema,
  patchTalentApplicationStatusBodySchema,
  talentApplicationCreatedResponseSchema,
  talentApplicationDetailResponseSchema,
  talentApplicationDetailSchema,
  talentApplicationIdParamsSchema,
  talentApplicationListQuerySchema,
  talentApplicationListResponseSchema,
  talentApplicationListItemSchema,
  talentApplicationStatusSchema,
} from './application.schema.js';

registry.register('TalentApplicationStatus', talentApplicationStatusSchema);
registry.register('TalentApplicationListItem', talentApplicationListItemSchema);
registry.register('TalentApplicationDetail', talentApplicationDetailSchema);
registry.register(
  'TalentApplicationCreatedResponse',
  talentApplicationCreatedResponseSchema,
);
registry.register(
  'TalentApplicationListResponse',
  talentApplicationListResponseSchema,
);
registry.register(
  'TalentApplicationDetailResponse',
  talentApplicationDetailResponseSchema,
);
registry.register('TalentApplicationIdParams', talentApplicationIdParamsSchema);
registry.register(
  'TalentApplicationListQuery',
  talentApplicationListQuerySchema,
);
registry.register(
  'CreateTalentApplicationBody',
  createTalentApplicationBodySchema,
);
registry.register(
  'PatchTalentApplicationStatusBody',
  patchTalentApplicationStatusBodySchema,
);
registry.register(
  'PatchTalentApplicationNotesBody',
  patchTalentApplicationNotesBodySchema,
);

registerPublicPath('/api/v1/talent-applications');

const adminSecurity = [{ apiKeyCookie: [] }];

registry.registerPath({
  method: 'post',
  path: '/api/v1/talent-applications',
  description:
    'Public. Creates a Talent Application (Round 1). Requires fullName, workEmail, phone, country, city, primaryRole, techStack, yearsExperience and resumeFileKey. Optional portfolio/github/linkedin URLs. Starts as NEW.',
  tags: ['Talent'],
  request: { body: requestBody(createTalentApplicationBodySchema) },
  responses: {
    201: {
      description: 'Application created',
      content: {
        'application/json': { schema: talentApplicationCreatedResponseSchema },
      },
    },
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/talent-applications',
  description:
    'Admin-only. Lists Talent Applications, newest first, with optional status filter and search over name/email/role. Paginated.',
  tags: ['Talent'],
  security: adminSecurity,
  request: { query: talentApplicationListQuerySchema },
  responses: {
    200: {
      description: 'Applications list',
      content: {
        'application/json': { schema: talentApplicationListResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/talent-applications/{id}',
  description:
    'Admin-only. Returns one Talent Application with immutable Round 1 data, completion data, internalNotes and talentProfileId.',
  tags: ['Talent'],
  security: adminSecurity,
  request: { params: talentApplicationIdParamsSchema },
  responses: {
    200: {
      description: 'Application detail',
      content: {
        'application/json': { schema: talentApplicationDetailResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Talent application not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/admin/talent-applications/{id}/status',
  description:
    'Admin-only. Moves a Talent Application to any workflow status (flexible transitions). Rejected can be reopened. No status history is recorded. Hard gates (completion request/profile creation) are enforced elsewhere.',
  tags: ['Talent'],
  security: adminSecurity,
  request: {
    params: talentApplicationIdParamsSchema,
    body: requestBody(patchTalentApplicationStatusBodySchema),
  },
  responses: {
    200: {
      description: 'Application updated',
      content: {
        'application/json': { schema: talentApplicationDetailResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Talent application not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/admin/talent-applications/{id}/notes',
  description:
    'Admin-only. Updates the admin-only internalNotes field. Never exposed to Talent or Clients.',
  tags: ['Talent'],
  security: adminSecurity,
  request: {
    params: talentApplicationIdParamsSchema,
    body: requestBody(patchTalentApplicationNotesBodySchema),
  },
  responses: {
    200: {
      description: 'Application updated',
      content: {
        'application/json': { schema: talentApplicationDetailResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Talent application not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/talent-applications/{id}/completion-request',
  description:
    'Admin-only. Sends or replaces a 7-day single-use completion request (photo + bio + headline). Requires Application APPROVED or COMPLETION_REQUESTED. Part of the applications sub-module even though it creates a ProfileCompletionRequest.',
  tags: ['Talent'],
  security: adminSecurity,
  request: { params: talentApplicationIdParamsSchema },
  responses: {
    201: {
      description: 'Completion request sent',
      content: {
        'application/json': {
          schema: talentApplicationDetailResponseSchema,
        },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Talent application not found'),
    422: errorResponse('Validation failed'),
  },
});
