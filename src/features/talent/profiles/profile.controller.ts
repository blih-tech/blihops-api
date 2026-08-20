import type { Request, Response } from 'express';

import { sendMany, sendSuccess } from '../../../shared/utils/response.js';
import {
  createTalentProfile,
  deactivateTalentAccount,
  getTalentProfile,
  hideTalentProfile,
  listTalentProfiles,
  reactivateTalentAccount,
  resendTalentInvitation,
  showTalentProfile,
  updateTalentProfile,
} from './profile.service.js';

export async function createTalentProfileController(
  req: Request,
  res: Response,
) {
  const { id } = req.params as { id: string };
  const profile = await createTalentProfile(
    id,
    req.body as {
      seniority: string;
      englishLevel: string;
      clientMonthlyRateEur: string;
      assessmentSummary: string;
      internalNotes: string;
    },
  );
  sendSuccess(res, profile, 201);
}

export async function listTalentProfilesController(
  req: Request,
  res: Response,
) {
  const q = req.query as Record<string, string | undefined>;
  const page = Number(q.page ?? 1);
  const pageSize = Number(q.pageSize ?? 20);
  const { items, total } = await listTalentProfiles({
    visibility: q.visibility,
    accountStatus: q.accountStatus,
    q: q.q,
    page,
    pageSize,
  });
  sendMany(res, items, {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function getTalentProfileController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const data = await getTalentProfile(id);
  sendSuccess(res, data);
}

export async function updateTalentProfileController(
  req: Request,
  res: Response,
) {
  const { id } = req.params as { id: string };
  const data = await updateTalentProfile(
    id,
    req.body as Partial<{
      seniority: string;
      englishLevel: string;
      clientMonthlyRateEur: string;
      assessmentSummary: string;
      internalNotes: string;
    }>,
  );
  sendSuccess(res, data);
}

export async function showTalentProfileController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const data = await showTalentProfile(id);
  sendSuccess(res, data);
}

export async function hideTalentProfileController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const data = await hideTalentProfile(id);
  sendSuccess(res, data);
}

export async function deactivateTalentController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const data = await deactivateTalentAccount(id);
  sendSuccess(res, data);
}

export async function reactivateTalentController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const data = await reactivateTalentAccount(id);
  sendSuccess(res, data);
}

export async function resendTalentInvitationController(
  req: Request,
  res: Response,
) {
  const { id } = req.params as { id: string };
  const data = await resendTalentInvitation(id);
  sendSuccess(res, data);
}
