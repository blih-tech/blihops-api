import { z } from 'zod';

import { registry } from './registry.js';
import {
  acceptInviteBodySchema,
  inviteBodySchema,
} from '../../features/auth/auth.schema.js';

const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z
      .array(
        z.object({
          path: z.string().optional(),
          message: z.string(),
        }),
      )
      .optional(),
  }),
});

registry.register('InviteBody', inviteBodySchema);
registry.register('AcceptInviteBody', acceptInviteBodySchema);
registry.register('ErrorEnvelope', errorEnvelopeSchema);

const mediaContent = (schema: z.ZodTypeAny) => ({
  'application/json': { schema },
});

const requestBody = (schema: z.ZodTypeAny) => ({
  content: mediaContent(schema),
});

const errorResponse = (description: string) => ({
  description,
  content: mediaContent(errorEnvelopeSchema),
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/invite',
  description:
    'Admin-only. Creates a user and sends a one-time invite email to activate their account.',
  tags: ['Auth'],
  request: {
    body: requestBody(inviteBodySchema),
  },
  responses: {
    201: {
      description: 'Invite created',
      content: mediaContent(
        z.object({
          data: z.object({
            invitedEmail: z.string().email(),
            role: inviteBodySchema.shape.role,
          }),
        }),
      ),
    },
    401: errorResponse('Authentication required'),
    403: errorResponse('Insufficient permissions'),
    409: errorResponse('A user with this email already exists'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/session-token',
  description:
    'Authenticated. Returns the raw session token for the current session, used to mirror the session into first-party apps.',
  tags: ['Auth'],
  security: [{ apiKeyCookie: [] }, { bearerAuth: [] }],
  responses: {
    200: {
      description: 'Session token',
      content: mediaContent(
        z.object({
          data: z.object({
            token: z.string(),
          }),
        }),
      ),
    },
    401: errorResponse('Authentication required'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/accept-invite',
  description:
    'Activates an invited account by setting a password with the one-time token from the invite email.',
  tags: ['Auth'],
  request: {
    body: requestBody(acceptInviteBodySchema),
  },
  responses: {
    200: {
      description: 'Account activated',
      content: mediaContent(
        z.object({
          data: z.object({
            activated: z.boolean(),
          }),
        }),
      ),
    },
    400: errorResponse('This invite link is invalid or has expired'),
    422: errorResponse('Validation failed'),
  },
});
