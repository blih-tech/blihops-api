import { randomUUID } from 'node:crypto';

import { hashPassword } from 'better-auth/crypto';

import { auth } from '../../shared/auth/auth.js';
import { logger } from '../../shared/configs/logger.js';
import { env } from '../../shared/configs/env.js';
import { prisma } from '../../shared/db/prisma.js';
import {
  BadRequestError,
  ConflictError,
  InternalServerError,
} from '../../shared/errors/httpErrors.js';
import type {
  AcceptInviteBody,
  AcceptInviteResult,
  InviteBody,
  InviteResult,
} from './auth.types.js';

const ACCEPT_INVITE_PATH = '/auth/accept-invitation';

export async function inviteUser(payload: InviteBody): Promise<InviteResult> {
  const existing = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (existing !== null) {
    throw new ConflictError('A user with this email already exists');
  }

  const userId = randomUUID();
  const tempPassword = randomUUID() + randomUUID();
  const passwordHash = await hashPassword(tempPassword);

  await prisma.$transaction([
    prisma.user.create({
      data: {
        id: userId,
        name: payload.name,
        email: payload.email,
        emailVerified: true,
        role: payload.role,
      },
    }),
    prisma.account.create({
      data: {
        id: randomUUID(),
        userId,
        accountId: userId,
        providerId: 'credential',
        password: passwordHash,
      },
    }),
  ]);

  try {
    await auth.api.requestPasswordReset({
      body: {
        email: payload.email,
        redirectTo: `${env.WEB_URL}${ACCEPT_INVITE_PATH}`,
      },
      headers: { 'x-invite-flow': '1' },
    });
  } catch (err) {
    logger.error({ err, email: payload.email }, 'failed to issue invite token');
    throw new InternalServerError('Failed to create invitation');
  }

  return { invitedEmail: payload.email, role: payload.role };
}

export async function acceptInvite(
  payload: AcceptInviteBody,
): Promise<AcceptInviteResult> {
  try {
    await auth.api.resetPassword({
      body: {
        newPassword: payload.newPassword,
        token: payload.token,
      },
    });
  } catch (err) {
    if (
      err instanceof Error &&
      'statusCode' in err &&
      typeof err.statusCode === 'number' &&
      err.statusCode < 500
    ) {
      throw new BadRequestError('This invite link is invalid or has expired');
    }
    throw err;
  }
  return { activated: true };
}
