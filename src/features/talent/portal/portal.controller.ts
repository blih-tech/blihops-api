import type { Request, Response } from 'express';

import { sendSuccess } from '../../../shared/utils/response.js';
import {
  getTalentMe,
  getTalentProfileForUser,
  updateTalentProfileForUser,
} from './portal.service.js';

export async function getTalentMeController(req: Request, res: Response) {
  const userId = (req as unknown as { auth: { user: { id: string } } }).auth
    .user.id;
  const data = await getTalentMe(userId);
  sendSuccess(res, data);
}

export async function getTalentPortalProfileController(
  req: Request,
  res: Response,
) {
  const userId = (req as unknown as { auth: { user: { id: string } } }).auth
    .user.id;
  const data = await getTalentProfileForUser(userId);
  sendSuccess(res, data);
}

export async function patchTalentPortalProfileController(
  req: Request,
  res: Response,
) {
  const userId = (req as unknown as { auth: { user: { id: string } } }).auth
    .user.id;
  const data = await updateTalentProfileForUser(
    userId,
    req.body as Record<string, unknown>,
  );
  sendSuccess(res, data);
}
