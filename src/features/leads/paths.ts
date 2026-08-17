import {
  errorResponse,
  registerPublicPath,
  requestBody,
} from '../../shared/openapi/common.js';
import { registry } from '../../shared/openapi/registry.js';
import {
  contactLeadBodySchema,
  leadCreatedResponseSchema,
  leadDetailResponseSchema,
  leadDetailSchema,
  leadIdParamsSchema,
  leadListQuerySchema,
  leadListResponseSchema,
  leadListItemSchema,
  leadStatusSchema,
  leadTypeSchema,
  patchLeadStatusBodySchema,
  pilotLeadBodySchema,
  webhookAckResponseSchema,
} from './schema.js';

registry.register('LeadType', leadTypeSchema);
registry.register('LeadStatus', leadStatusSchema);
registry.register('LeadListItem', leadListItemSchema);
registry.register('LeadDetail', leadDetailSchema);
registry.register('LeadCreatedResponse', leadCreatedResponseSchema);
registry.register('LeadListResponse', leadListResponseSchema);
registry.register('LeadDetailResponse', leadDetailResponseSchema);
registry.register('LeadIdParams', leadIdParamsSchema);
registry.register('LeadListQuery', leadListQuerySchema);
registry.register('ContactLeadBody', contactLeadBodySchema);
registry.register('PilotLeadBody', pilotLeadBodySchema);
registry.register('PatchLeadStatusBody', patchLeadStatusBodySchema);
registry.register('WebhookAckResponse', webhookAckResponseSchema);

const cookieSecurity = [{ apiKeyCookie: [] }];

registerPublicPath('/api/v1/leads/contact');
registerPublicPath('/api/v1/leads/pilot');
registerPublicPath('/api/v1/leads/webhooks/calcom');

registry.registerPath({
  method: 'post',
  path: '/api/v1/leads/contact',
  description:
    'Public. Creates a CONTACT lead from the contact form. The `website` field is a honeypot — non-empty values are treated as bot traffic and acknowledged without persisting. Rate-limited (20 req / 10 min / IP).',
  tags: ['Leads'],
  request: {
    body: requestBody(contactLeadBodySchema),
  },
  responses: {
    201: {
      description: 'Lead created',
      content: {
        'application/json': { schema: leadCreatedResponseSchema },
      },
    },
    422: errorResponse('Validation failed'),
    429: errorResponse('Too many requests'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/leads/pilot',
  description:
    'Public. Creates a PILOT lead from the pilot form. Honeypot and rate limiting behave like /leads/contact.',
  tags: ['Leads'],
  request: {
    body: requestBody(pilotLeadBodySchema),
  },
  responses: {
    201: {
      description: 'Lead created',
      content: {
        'application/json': { schema: leadCreatedResponseSchema },
      },
    },
    422: errorResponse('Validation failed'),
    429: errorResponse('Too many requests'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/leads/webhooks/calcom',
  description:
    'Public (signature-verified). Cal.com webhook receiver. Handles BOOKING_CREATED (creates a CALL lead with booking time, meeting URL and popup answers, idempotent by booking UID), BOOKING_CANCELLED (closes the matched lead unless CONVERTED) and BOOKING_RESCHEDULED (matches via rescheduleUid, updates booking time/meeting URL and re-points the booking UID). Unknown events are acknowledged with 200.',
  tags: ['Leads'],
  responses: {
    200: {
      description: 'Event acknowledged',
      content: {
        'application/json': { schema: webhookAckResponseSchema },
      },
    },
    401: errorResponse('Invalid webhook signature'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/leads/admin',
  description:
    'Admin-only. Lists leads, newest first, with optional type/status filters and free-text search over name/email/company. Paginated.',
  tags: ['Leads'],
  security: cookieSecurity,
  request: {
    query: leadListQuerySchema,
  },
  responses: {
    200: {
      description: 'Leads list',
      content: {
        'application/json': { schema: leadListResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/leads/admin/{id}',
  description:
    'Admin-only. Returns one lead with its full type-specific details.',
  tags: ['Leads'],
  security: cookieSecurity,
  request: {
    params: leadIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Lead detail',
      content: {
        'application/json': { schema: leadDetailResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Lead not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/leads/admin/{id}',
  description:
    'Admin-only. Updates a lead status. Only `status` is accepted — lead submissions are immutable records.',
  tags: ['Leads'],
  security: cookieSecurity,
  request: {
    params: leadIdParamsSchema,
    body: requestBody(patchLeadStatusBodySchema),
  },
  responses: {
    200: {
      description: 'Lead updated',
      content: {
        'application/json': { schema: leadDetailResponseSchema },
      },
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Lead not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/leads/admin/{id}',
  description: 'Admin-only. Deletes a lead.',
  tags: ['Leads'],
  security: cookieSecurity,
  request: {
    params: leadIdParamsSchema,
  },
  responses: {
    204: { description: 'Lead deleted (no content)' },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    404: errorResponse('Lead not found'),
    422: errorResponse('Validation failed'),
  },
});
