import { randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';

import { Prisma } from '../../../generated/prisma/client.js';
import { prisma } from '../../../shared/db/prisma.js';
import { auth } from '../../../shared/auth/auth.js';
import { env } from '../../../shared/configs/env.js';
import { logger } from '../../../shared/configs/logger.js';
import {
  BadRequestError,
  NotFoundError,
} from '../../../shared/errors/httpErrors.js';
import { findUserByEmail } from '../../auth/auth.repository.js';
import { findApplicationById } from '../completion/completion.repository.js';
import {
  findTalentProfileById,
  findTalentProfiles,
} from './profile.repository.js';

const ACCEPT_INVITE_PATH = '/auth/accept-invitation';

function checkVisibilityReady(profile: {
  profilePhotoKey: string | null;
  professionalHeadline: string | null;
  shortBio: string | null;
  fullName: string | null;
  primaryRole: string | null;
  seniority: string | null;
  yearsExperience: number | null;
  techStack: string[] | null;
  secondarySkills: string[] | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  resumeFileKey: string | null;
  englishLevel: string | null;
  isVerified: boolean | null;
  clientMonthlyRateEur: unknown;
}): string[] {
  const missing: string[] = [];
  if (!profile.profilePhotoKey) missing.push('profilePhotoKey');
  if (!profile.fullName) missing.push('fullName');
  if (!profile.professionalHeadline) missing.push('professionalHeadline');
  if (!profile.shortBio) missing.push('shortBio');
  if (!profile.primaryRole) missing.push('primaryRole');
  if (!profile.seniority) missing.push('seniority');
  if (profile.yearsExperience === null || profile.yearsExperience === undefined)
    missing.push('yearsExperience');
  if (!profile.techStack || profile.techStack.length === 0)
    missing.push('techStack');
  // secondarySkills may be empty, but we still require the field to exist (empty array allowed) – not missing
  if (profile.portfolioUrl === undefined) missing.push('portfolioUrl');
  if (profile.githubUrl === undefined) missing.push('githubUrl');
  if (profile.linkedinUrl === undefined) missing.push('linkedinUrl');
  if (!profile.resumeFileKey) missing.push('resumeFileKey');
  if (!profile.englishLevel) missing.push('englishLevel');
  if (!profile.isVerified) missing.push('isVerified');
  if (!profile.clientMonthlyRateEur) missing.push('clientMonthlyRateEur');
  return missing;
}

export async function createTalentProfile(
  applicationId: string,
  payload: {
    seniority: string;
    englishLevel: string;
    clientMonthlyRateEur: string;
    assessmentSummary: string;
    internalNotes: string;
  },
) {
  const app = await findApplicationById(applicationId);
  if (app === null) throw new NotFoundError('Talent application not found');
  if (app.status !== 'COMPLETION_SUBMITTED') {
    throw new BadRequestError(
      'Profile can only be created after completion is submitted',
    );
  }
  if (
    app.completionPhotoKey === null ||
    app.completionShortBio === null ||
    app.completionProfessionalHeadline === null
  ) {
    throw new BadRequestError('Completion data is incomplete');
  }

  const existing = await prisma.talentProfile.findUnique({
    where: { applicationId },
  });
  if (existing)
    throw new BadRequestError('Profile already exists for this application');

  const emailExists = await findUserByEmail(app.workEmail);
  if (emailExists)
    throw new BadRequestError('A user with this email already exists');

  const userId = randomUUID();
  const tempPassword = randomUUID() + randomUUID();
  const passwordHash = await hashPassword(tempPassword);

  const result = await prisma.$transaction(async (tx) => {
    const profile = await tx.talentProfile.create({
      data: {
        applicationId,
        fullName: app.fullName,
        workEmail: app.workEmail,
        phone: app.phone,
        country: app.country,
        city: app.city,
        profilePhotoKey: app.completionPhotoKey as string,
        professionalHeadline: app.completionProfessionalHeadline as string,
        shortBio: app.completionShortBio as string,
        primaryRole: app.primaryRole,
        techStack: app.techStack,
        secondarySkills: app.secondarySkills,
        yearsExperience: app.yearsExperience,
        portfolioUrl: app.portfolioUrl,
        githubUrl: app.githubUrl,
        linkedinUrl: app.linkedinUrl,
        resumeFileKey: app.resumeFileKey,
        seniority: payload.seniority,
        englishLevel: payload.englishLevel,
        clientMonthlyRateEur: new Prisma.Decimal(payload.clientMonthlyRateEur),
        assessmentSummary: payload.assessmentSummary,
        internalNotes: payload.internalNotes,
        isVerified: true,
        visibility: 'HIDDEN',
      },
    });

    await tx.user.create({
      data: {
        id: userId,
        name: app.fullName,
        email: app.workEmail,
        emailVerified: true,
        role: 'talent',
      },
    });
    await tx.account.create({
      data: {
        id: randomUUID(),
        userId,
        accountId: userId,
        providerId: 'credential',
        password: passwordHash,
      },
    });

    const talentAccount = await tx.talentAccount.create({
      data: {
        userId,
        talentProfileId: profile.id,
        status: 'PENDING_INVITATION',
        invitedAt: new Date(),
      },
    });

    await tx.talentInvitation.create({
      data: {
        talentAccountId: talentAccount.id,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await tx.talentApplication.update({
      where: { id: applicationId },
      data: { status: 'PROFILE_CREATED' },
    });

    return { profile, talentAccount };
  });

  // Send invitation email via better-auth (fire-and-forget)
  try {
    await auth.api.requestPasswordReset({
      body: {
        email: app.workEmail,
        redirectTo: `${env.WEB_URL}${ACCEPT_INVITE_PATH}`,
      },
      headers: { 'x-invite-flow': '1' },
    });
  } catch (err) {
    logger.warn(
      { err, email: app.workEmail },
      'talent invitation email failed',
    );
  }

  return result.profile;
}

export async function listTalentProfiles(filters: {
  visibility?: string | undefined;
  accountStatus?: string | undefined;
  q?: string | undefined;
  page: number;
  pageSize: number;
}) {
  const where: Prisma.TalentProfileWhereInput = {};
  if (filters.visibility) where.visibility = filters.visibility as never;
  if (filters.accountStatus)
    where.talentAccount = { status: filters.accountStatus as never };
  if (filters.q && filters.q.length > 0) {
    where.OR = [
      { fullName: { contains: filters.q, mode: 'insensitive' } },
      { primaryRole: { contains: filters.q, mode: 'insensitive' } },
      { workEmail: { contains: filters.q, mode: 'insensitive' } },
    ];
  }
  const [rows, total] = await findTalentProfiles(
    where,
    filters.page,
    filters.pageSize,
  );
  const items = rows.map(
    (
      r: { talentAccount: { status: string } | null } & Record<string, unknown>,
    ) => ({
      id: r.id as string,
      fullName: r.fullName as string,
      primaryRole: r.primaryRole as string,
      seniority: r.seniority as string,
      englishLevel: r.englishLevel as string,
      visibility: r.visibility as never,
      accountStatus: (r.talentAccount?.status ?? 'PENDING_INVITATION') as never,
      clientMonthlyRateEur: String(r.clientMonthlyRateEur),
      isVerified: r.isVerified as boolean,
      createdAt: (r.createdAt as Date).toISOString(),
      updatedAt: (r.updatedAt as Date).toISOString(),
    }),
  );
  return { items, total };
}

export async function getTalentProfile(id: string) {
  const row = await findTalentProfileById(id);
  if (!row) throw new NotFoundError('Talent profile not found');
  return {
    id: row.id,
    fullName: row.fullName,
    workEmail: row.workEmail,
    phone: row.phone,
    country: row.country,
    city: row.city,
    profilePhotoKey: row.profilePhotoKey,
    professionalHeadline: row.professionalHeadline,
    shortBio: row.shortBio,
    primaryRole: row.primaryRole,
    techStack: row.techStack,
    secondarySkills: row.secondarySkills,
    yearsExperience: row.yearsExperience,
    portfolioUrl: row.portfolioUrl,
    githubUrl: row.githubUrl,
    linkedinUrl: row.linkedinUrl,
    resumeFileKey: row.resumeFileKey,
    seniority: row.seniority,
    englishLevel: row.englishLevel,
    clientMonthlyRateEur: String(row.clientMonthlyRateEur),
    assessmentSummary: row.assessmentSummary,
    internalNotes: row.internalNotes,
    isVerified: row.isVerified,
    visibility: row.visibility as never,
    accountStatus: (row.talentAccount?.status ?? 'PENDING_INVITATION') as never,
    applicationId: row.applicationId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function updateTalentProfile(
  id: string,
  payload: Partial<{
    seniority: string;
    englishLevel: string;
    clientMonthlyRateEur: string;
    assessmentSummary: string;
    internalNotes: string;
  }>,
) {
  const existing = await findTalentProfileById(id);
  if (!existing) throw new NotFoundError('Talent profile not found');
  if (existing.visibility === 'VISIBLE') {
    throw new BadRequestError('Profile is visible — hide it before editing');
  }
  const data: Record<string, unknown> = {};
  if (payload.seniority !== undefined) data.seniority = payload.seniority;
  if (payload.englishLevel !== undefined)
    data.englishLevel = payload.englishLevel;
  if (payload.clientMonthlyRateEur !== undefined)
    data.clientMonthlyRateEur = new Prisma.Decimal(
      payload.clientMonthlyRateEur,
    );
  if (payload.assessmentSummary !== undefined)
    data.assessmentSummary = payload.assessmentSummary;
  if (payload.internalNotes !== undefined)
    data.internalNotes = payload.internalNotes;

  await prisma.talentProfile.update({ where: { id }, data: data as never });
  return getTalentProfile(id);
}

export async function showTalentProfile(id: string) {
  const row = await findTalentProfileById(id);
  if (!row) throw new NotFoundError('Talent profile not found');
  const missing = checkVisibilityReady(row);
  if (missing.length > 0) {
    throw new BadRequestError(
      `Profile not ready for visibility: ${missing.join(', ')}`,
    );
  }
  if (
    row.talentAccount?.status !== 'ACTIVE' &&
    row.talentAccount?.status !== 'PENDING_INVITATION'
  ) {
    // allow publishing even before activation, but account must not be deactivated
    if (row.talentAccount?.status === 'DEACTIVATED')
      throw new BadRequestError('Talent account is deactivated');
  }
  await prisma.talentProfile.update({
    where: { id },
    data: { visibility: 'VISIBLE' },
  });
  return getTalentProfile(id);
}

export async function hideTalentProfile(id: string) {
  const row = await findTalentProfileById(id);
  if (!row) throw new NotFoundError('Talent profile not found');
  await prisma.talentProfile.update({
    where: { id },
    data: { visibility: 'HIDDEN' },
  });
  return getTalentProfile(id);
}

export async function deactivateTalentAccount(profileId: string) {
  const row = await findTalentProfileById(profileId);
  if (!row || !row.talentAccount)
    throw new NotFoundError('Talent profile or account not found');
  await prisma.$transaction(async (tx) => {
    await tx.talentAccount.update({
      where: { id: row.talentAccount!.id },
      data: { status: 'DEACTIVATED', deactivatedAt: new Date() },
    });
    await tx.talentProfile.update({
      where: { id: profileId },
      data: { visibility: 'HIDDEN' },
    });
  });
  return getTalentProfile(profileId);
}

export async function reactivateTalentAccount(profileId: string) {
  const row = await findTalentProfileById(profileId);
  if (!row || !row.talentAccount)
    throw new NotFoundError('Talent profile or account not found');
  await prisma.talentAccount.update({
    where: { id: row.talentAccount.id },
    data: { status: 'ACTIVE', deactivatedAt: null },
  });
  return getTalentProfile(profileId);
}

export async function resendTalentInvitation(profileId: string) {
  const row = await findTalentProfileById(profileId);
  if (!row || !row.talentAccount)
    throw new NotFoundError('Talent profile or account not found');
  const email = row.workEmail;
  // mark previous pending as REPLACED
  const pending = await prisma.talentInvitation.findFirst({
    where: { talentAccountId: row.talentAccount.id, status: 'PENDING' },
  });
  if (pending) {
    await prisma.talentInvitation.update({
      where: { id: pending.id },
      data: { status: 'REPLACED', replacedAt: new Date() },
    });
  }
  await prisma.talentInvitation.create({
    data: {
      talentAccountId: row.talentAccount.id,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.talentAccount.update({
    where: { id: row.talentAccount.id },
    data: { status: 'PENDING_INVITATION', invitedAt: new Date() },
  });
  try {
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: `${env.WEB_URL}${ACCEPT_INVITE_PATH}` },
      headers: { 'x-invite-flow': '1' },
    });
  } catch (err) {
    logger.warn({ err, email }, 'talent invitation resend failed');
    throw new BadRequestError('Failed to send invitation');
  }
  return { sentTo: email };
}
