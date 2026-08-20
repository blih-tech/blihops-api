import { errorResponse, requestBody } from '../../../shared/openapi/common.js';
import { registry } from '../../../shared/openapi/registry.js';
import {
  talentMeResponseSchema,
  talentPortalDetailResponseSchema,
  updateTalentPortalBodySchema,
} from './portal.schema.js';

registry.register('UpdateTalentPortalBody', updateTalentPortalBodySchema);
registry.register('TalentMeResponse', talentMeResponseSchema);
registry.register(
  'TalentPortalDetailResponse',
  talentPortalDetailResponseSchema,
);

const talentSecurity = [{ apiKeyCookie: [] }];

registry.registerPath({
  method: 'get',
  path: '/api/v1/talent/me',
  tags: ['Talent'],
  security: talentSecurity,
  responses: {
    200: {
      description: 'Current talent me',
      content: { 'application/json': { schema: talentMeResponseSchema } },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/talent/profile',
  tags: ['Talent'],
  security: talentSecurity,
  responses: {
    200: {
      description: 'Talent portal profile',
      content: {
        'application/json': { schema: talentPortalDetailResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Talent account not found'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/talent/profile',
  tags: ['Talent'],
  security: talentSecurity,
  request: { body: requestBody(updateTalentPortalBodySchema) },
  responses: {
    200: {
      description: 'Profile updated',
      content: {
        'application/json': { schema: talentPortalDetailResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    422: errorResponse('Validation failed'),
  },
});
