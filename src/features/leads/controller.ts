import type { Request, Response } from 'express';

import { LeadWebhookInvalidError } from '../../shared/errors/httpErrors.js';
import { type BodyOf } from '../../shared/middlewares/validate.js';
import { sendSuccess } from '../../shared/utils/response.js';
import {
  contactLeadBodySchema,
  pilotLeadBodySchema,
  type LeadCreatedResponse,
} from './schema.js';
import {
  createContactLead,
  createPilotLead,
  handleCalWebhook,
} from './service.js';
import { extractCalWebhookEvent, verifyCalSignature } from './webhook.js';

type RawBodyRequest = Request & { rawBody?: Buffer };

function isHoneypotTriggered(website: string | undefined): boolean {
  return website !== undefined && website.trim().length > 0;
}

function sendHoneypotSuccess(res: Response, type: 'CONTACT' | 'PILOT'): void {
  // Indistinguishable from a real success — the bot learns nothing.
  const fake: LeadCreatedResponse = { id: 'honeypot', type, status: 'NEW' };
  sendSuccess(res, fake, 201);
}

export async function createContactLeadController(
  req: BodyOf<typeof contactLeadBodySchema>,
  res: Response,
) {
  if (isHoneypotTriggered(req.body.website)) {
    sendHoneypotSuccess(res, 'CONTACT');
    return;
  }
  const lead = await createContactLead(req.body);
  sendSuccess(res, lead, 201);
}

export async function createPilotLeadController(
  req: BodyOf<typeof pilotLeadBodySchema>,
  res: Response,
) {
  if (isHoneypotTriggered(req.body.website)) {
    sendHoneypotSuccess(res, 'PILOT');
    return;
  }
  const lead = await createPilotLead(req.body);
  sendSuccess(res, lead, 201);
}

export async function calWebhookController(req: Request, res: Response) {
  const rawBody = (req as RawBodyRequest).rawBody;
  if (
    rawBody === undefined ||
    !verifyCalSignature(rawBody, req.header('x-cal-signature-256'))
  ) {
    throw new LeadWebhookInvalidError('Invalid webhook signature');
  }
  const event = extractCalWebhookEvent(req.body);
  await handleCalWebhook(event);
  sendSuccess(res, { ok: true });
}
