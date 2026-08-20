import {
  errorResponse,
  registerPublicPath,
  requestBody,
} from '../../../shared/openapi/common.js';
import { registry } from '../../../shared/openapi/registry.js';
import {
  completionInfoResponseSchema,
  completionSubmitResponseSchema,
  completionTokenParamsSchema,
  submitCompletionBodySchema,
} from './completion.schema.js';
registry.register('CompletionTokenParams', completionTokenParamsSchema);
registry.register('SubmitCompletionBody', submitCompletionBodySchema);
registry.register('CompletionInfoResponse', completionInfoResponseSchema);
registry.register('CompletionSubmitResponse', completionSubmitResponseSchema);

registerPublicPath('/api/v1/profile-completion-requests/{token}');
registerPublicPath('/api/v1/profile-completion-requests/{token}/submit');

registry.registerPath({
  method: 'get',
  path: '/api/v1/profile-completion-requests/{token}',
  description:
    'Public (token). Returns completion request info if token is valid, pending and not expired.',
  tags: ['Talent'],
  request: { params: completionTokenParamsSchema },
  responses: {
    200: {
      description: 'Completion info',
      content: { 'application/json': { schema: completionInfoResponseSchema } },
    },
    404: errorResponse('Completion request not found'),
    422: errorResponse('Validation failed'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/profile-completion-requests/{token}/submit',
  description:
    'Public (token). Submits photo, shortBio and professionalHeadline. Consumes token and sets Application to COMPLETION_SUBMITTED.',
  tags: ['Talent'],
  request: {
    params: completionTokenParamsSchema,
    body: requestBody(submitCompletionBodySchema),
  },
  responses: {
    200: {
      description: 'Completion submitted',
      content: {
        'application/json': { schema: completionSubmitResponseSchema },
      },
    },
    400: errorResponse('Link already used or expired'),
    404: errorResponse('Completion request not found'),
    422: errorResponse('Validation failed'),
  },
});
