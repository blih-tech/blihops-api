import { createHash, randomUUID } from 'node:crypto';

import { prisma } from '../../../shared/db/prisma.js';
import { env } from '../../../shared/configs/env.js';
import { logger } from '../../../shared/configs/logger.js';
import {
  BadRequestError,
  NotFoundError,
} from '../../../shared/errors/httpErrors.js';
import {
  createEmailClient,
  completionRequestTemplate,
} from '../../../shared/email/index.js';
import {
  findApplicationById,
  findCompletionByTokenHash,
  findPendingCompletionByApplicationId,
} from './completion.repository.js';

const COMPLETION_TTL_DAYS = 7;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function sendCompletionRequest(
  applicationId: string,
): Promise<{ requestId: string; expiresAt: string }> {
  const app = await findApplicationById(applicationId);
  if (app === null) throw new NotFoundError('Talent application not found');
  if (app.status !== 'APPROVED' && app.status !== 'COMPLETION_REQUESTED') {
    throw new BadRequestError(
      'Completion request can only be sent after approval',
    );
  }

  const token = randomUUID() + randomUUID();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + COMPLETION_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  const existing = await findPendingCompletionByApplicationId(applicationId);

  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.profileCompletionRequest.update({
        where: { id: existing.id },
        data: { status: 'REPLACED', replacedAt: new Date() },
      });
    }
    await tx.profileCompletionRequest.create({
      data: {
        applicationId,
        tokenHash,
        status: 'PENDING',
        expiresAt,
      },
    });
    if (app.status === 'APPROVED') {
      await tx.talentApplication.update({
        where: { id: applicationId },
        data: { status: 'COMPLETION_REQUESTED' },
      });
    }
  });

  const completionUrl = `${env.WEB_URL}/talent/complete-profile?token=${token}`;
  const emailClient = createEmailClient();
  const template = completionRequestTemplate(
    env.EMAIL_LOGO_URL,
    completionUrl,
    app.fullName,
  );
  // fire-and-forget, but log failures
  void emailClient.send({ to: app.workEmail, ...template }).catch((err) => {
    logger.warn({ err, to: app.workEmail }, 'completion request email failed');
  });

  // For test env, return token hash info; in prod the raw token is only in email.
  // We return requestId/expiresAt for admin UI. The raw token is not stored.
  const created = await findPendingCompletionByApplicationId(applicationId);
  return { requestId: created?.id ?? '', expiresAt: expiresAt.toISOString() };
}

export async function getCompletionByToken(token: string) {
  const tokenHash = hashToken(token);
  const req = await findCompletionByTokenHash(tokenHash);
  if (req === null) throw new NotFoundError('Completion request not found');
  if (req.status !== 'PENDING')
    throw new BadRequestError('This link has already been used');
  if (req.expiresAt < new Date()) {
    await prisma.profileCompletionRequest.update({
      where: { id: req.id },
      data: { status: 'EXPIRED' },
    });
    throw new BadRequestError('This link has expired');
  }
  return {
    applicationId: req.applicationId,
    fullName: req.application.fullName,
    workEmail: req.application.workEmail,
    expiresAt: req.expiresAt.toISOString(),
  };
}

export async function submitCompletion(
  token: string,
  payload: {
    photoFileKey: string;
    shortBio: string;
    professionalHeadline: string;
  },
) {
  const tokenHash = hashToken(token);
  const req = await findCompletionByTokenHash(tokenHash);
  if (req === null) throw new NotFoundError('Completion request not found');
  if (req.status !== 'PENDING')
    throw new BadRequestError('This link has already been used');
  if (req.expiresAt < new Date()) {
    await prisma.profileCompletionRequest.update({
      where: { id: req.id },
      data: { status: 'EXPIRED' },
    });
    throw new BadRequestError('This link has expired');
  }

  await prisma.$transaction(async (tx) => {
    await tx.talentApplication.update({
      where: { id: req.applicationId },
      data: {
        completionPhotoKey: payload.photoFileKey,
        completionShortBio: payload.shortBio,
        completionProfessionalHeadline: payload.professionalHeadline,
        completionSubmittedAt: new Date(),
        status: 'COMPLETION_SUBMITTED',
      },
    });
    await tx.profileCompletionRequest.update({
      where: { id: req.id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    });
  });

  return {
    applicationId: req.applicationId,
    status: 'COMPLETION_SUBMITTED' as const,
  };
}
