import { Router } from 'express';

import { validate } from '../../../shared/middlewares/validate.js';
import {
  getCompletionRequestController,
  submitCompletionController,
} from './completion.controller.js';
import {
  completionTokenParamsSchema,
  submitCompletionBodySchema,
} from './completion.schema.js';

export const publicCompletionRouter = Router();

publicCompletionRouter.get(
  '/:token',
  validate('params', completionTokenParamsSchema),
  getCompletionRequestController,
);

publicCompletionRouter.post(
  '/:token/submit',
  validate('params', completionTokenParamsSchema),
  validate('body', submitCompletionBodySchema),
  submitCompletionController,
);
