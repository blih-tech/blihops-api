import type { Request, Response } from 'express';

import { ValidationError } from '../../shared/errors/httpErrors.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { acceptInviteBodySchema, inviteBodySchema } from './auth.schema.js';
import { acceptInvite, inviteUser } from './auth.service.js';

export async function inviteUserController(req: Request, res: Response) {
  const parsed = inviteBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw ValidationError.fromZod(parsed.error);
  }

  const result = await inviteUser(parsed.data);
  sendSuccess(res, result, 201);
}

export async function acceptInviteController(req: Request, res: Response) {
  const parsed = acceptInviteBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw ValidationError.fromZod(parsed.error);
  }

  const result = await acceptInvite(parsed.data);
  sendSuccess(res, result);
}
