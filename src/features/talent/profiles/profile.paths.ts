import { errorResponse, requestBody } from '../../../shared/openapi/common.js';
import { registry } from '../../../shared/openapi/registry.js';
import {
  createTalentProfileBodySchema,
  talentProfileDetailResponseSchema,
  talentProfileIdParamsSchema,
  talentProfileListQuerySchema,
  talentProfileListResponseSchema,
  talentProfileDetailSchema,
  updateTalentProfileBodySchema,
} from './profile.schema.js';
import { talentApplicationIdParamsSchema } from '../applications/application.schema.js';

registry.register('TalentProfileDetail', talentProfileDetailSchema);
registry.register('CreateTalentProfileBody', createTalentProfileBodySchema);
registry.register('UpdateTalentProfileBody', updateTalentProfileBodySchema);

const adminSecurity = [{ apiKeyCookie: [] }];

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/talent-applications/{id}/create-profile',
  description:
    'Admin-only. Creates TalentProfile(HIDDEN, isVerified=true) + User(TALENT) + TalentAccount(PENDING) + invitation from COMPLETION_SUBMITTED. Requires seniority, englishLevel, clientMonthlyRateEur, assessmentSummary, internalNotes.',
  tags: ['Talent'],
  security: adminSecurity,
  request: {
    params: talentApplicationIdParamsSchema,
    body: requestBody(createTalentProfileBodySchema),
  },
  responses: {
    201: {
      description: 'Profile created',
      content: {
        'application/json': { schema: talentProfileDetailResponseSchema },
      },
    },
    400: errorResponse('Profile creation not allowed'),
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Talent application not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/talent-profiles',
  description:
    'Admin-only. Lists Talent Profiles with visibility/accountStatus filters.',
  tags: ['Talent'],
  security: adminSecurity,
  request: { query: talentProfileListQuerySchema },
  responses: {
    200: {
      description: 'Profiles list',
      content: {
        'application/json': { schema: talentProfileListResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/talent-profiles/{id}',
  tags: ['Talent'],
  security: adminSecurity,
  request: { params: talentProfileIdParamsSchema },
  responses: {
    200: {
      description: 'Profile detail',
      content: {
        'application/json': { schema: talentProfileDetailResponseSchema },
      },
    },
    404: errorResponse('Talent profile not found'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/admin/talent-profiles/{id}',
  tags: ['Talent'],
  security: adminSecurity,
  request: {
    params: talentProfileIdParamsSchema,
    body: requestBody(updateTalentProfileBodySchema),
  },
  responses: {
    200: {
      description: 'Profile updated',
      content: {
        'application/json': { schema: talentProfileDetailResponseSchema },
      },
    },
    400: errorResponse('Visible profile cannot be edited'),
    404: errorResponse('Talent profile not found'),
  },
});

for (const action of [
  'show',
  'hide',
  'deactivate',
  'reactivate',
  'invitation',
] as const) {
  registry.registerPath({
    method: 'post',
    path: `/api/v1/admin/talent-profiles/{id}/${action}`,
    tags: ['Talent'],
    security: adminSecurity,
    request: { params: talentProfileIdParamsSchema },
    responses: {
      200: {
        description: `${action} ok`,
        content: {
          'application/json': { schema: talentProfileDetailResponseSchema },
        },
      },
      404: errorResponse('Talent profile not found'),
    },
  });
}
