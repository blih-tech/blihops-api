import { Router } from 'express';

import { formRateLimiter } from '../../shared/middlewares/rateLimit.js';
import { validate } from '../../shared/middlewares/validate.js';
import { adminLeadsRouter } from './admin/index.js';
import {
  calWebhookController,
  createContactLeadController,
  createPilotLeadController,
} from './controller.js';
import { contactLeadBodySchema, pilotLeadBodySchema } from './schema.js';

export const leadsRouter = Router();

leadsRouter.post(
  '/contact',
  formRateLimiter,
  validate('body', contactLeadBodySchema),
  createContactLeadController,
);

leadsRouter.post(
  '/pilot',
  formRateLimiter,
  validate('body', pilotLeadBodySchema),
  createPilotLeadController,
);

leadsRouter.post('/webhooks/calcom', calWebhookController);

leadsRouter.use('/admin', adminLeadsRouter);
