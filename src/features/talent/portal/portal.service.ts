import { prisma } from '../../../shared/db/prisma.js';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../../shared/errors/httpErrors.js';
import { findTalentAccountByUserId } from './portal.repository.js';

export async function getTalentMe(userId: string) {
  const acc = await findTalentAccountByUserId(userId);
  if (!acc) throw new NotFoundError('Talent account not found');
  return {
    user: { id: acc.user.id, name: acc.user.name, email: acc.user.email },
    talentAccount: { id: acc.id, status: acc.status },
    talentProfile: {
      id: acc.talentProfile.id,
      visibility: acc.talentProfile.visibility,
      isVerified: acc.talentProfile.isVerified,
    },
  };
}

export async function getTalentProfileForUser(userId: string) {
  const acc = await findTalentAccountByUserId(userId);
  if (!acc) throw new NotFoundError('Talent account not found');
  if (acc.status !== 'ACTIVE')
    throw new ForbiddenError('Talent account is not active');
  const p = acc.talentProfile;
  return {
    id: p.id,
    fullName: p.fullName,
    workEmail: p.workEmail,
    phone: p.phone,
    country: p.country,
    city: p.city,
    profilePhotoKey: p.profilePhotoKey,
    professionalHeadline: p.professionalHeadline,
    shortBio: p.shortBio,
    primaryRole: p.primaryRole,
    techStack: p.techStack,
    secondarySkills: p.secondarySkills,
    yearsExperience: p.yearsExperience,
    portfolioUrl: p.portfolioUrl,
    githubUrl: p.githubUrl,
    linkedinUrl: p.linkedinUrl,
    resumeFileKey: p.resumeFileKey,
    seniority: p.seniority,
    englishLevel: p.englishLevel,
    clientMonthlyRateEur: String(p.clientMonthlyRateEur),
    isVerified: p.isVerified,
    visibility: p.visibility,
    accountStatus: acc.status,
  };
}

export async function updateTalentProfileForUser(
  userId: string,
  payload: Record<string, unknown>,
) {
  const acc = await findTalentAccountByUserId(userId);
  if (!acc) throw new NotFoundError('Talent account not found');
  if (acc.status !== 'ACTIVE')
    throw new ForbiddenError('Talent account is not active');

  const allowed = [
    'professionalHeadline',
    'shortBio',
    'primaryRole',
    'techStack',
    'secondarySkills',
    'yearsExperience',
    'portfolioUrl',
    'githubUrl',
    'linkedinUrl',
    'profilePhotoKey',
    'resumeFileKey',
  ] as const;
  for (const k of Object.keys(payload)) {
    if (!allowed.includes(k as never))
      throw new BadRequestError(`Field ${k} is not editable`);
  }

  const data: Record<string, unknown> = {};
  if (payload.professionalHeadline !== undefined)
    data.professionalHeadline = payload.professionalHeadline;
  if (payload.shortBio !== undefined) data.shortBio = payload.shortBio;
  if (payload.primaryRole !== undefined) data.primaryRole = payload.primaryRole;
  if (payload.techStack !== undefined) data.techStack = payload.techStack;
  if (payload.secondarySkills !== undefined)
    data.secondarySkills = payload.secondarySkills;
  if (payload.yearsExperience !== undefined)
    data.yearsExperience = payload.yearsExperience;
  if (payload.portfolioUrl !== undefined)
    data.portfolioUrl =
      payload.portfolioUrl === '' ? null : payload.portfolioUrl;
  if (payload.githubUrl !== undefined)
    data.githubUrl = payload.githubUrl === '' ? null : payload.githubUrl;
  if (payload.linkedinUrl !== undefined)
    data.linkedinUrl = payload.linkedinUrl === '' ? null : payload.linkedinUrl;
  if (payload.profilePhotoKey !== undefined)
    data.profilePhotoKey = payload.profilePhotoKey;
  if (payload.resumeFileKey !== undefined)
    data.resumeFileKey = payload.resumeFileKey;

  // Validate required client-visible fields won't be cleared
  const next = { ...acc.talentProfile, ...data } as Record<string, unknown>;
  const required: (keyof typeof next)[] = [
    'profilePhotoKey',
    'professionalHeadline',
    'shortBio',
    'primaryRole',
    'techStack',
    'resumeFileKey',
  ];
  for (const f of required) {
    const v = next[f];
    if (v === null || v === '' || (Array.isArray(v) && v.length === 0)) {
      throw new BadRequestError(`${String(f)} is required`);
    }
  }

  await prisma.talentProfile.update({
    where: { id: acc.talentProfileId },
    data: data as never,
  });
  return getTalentProfileForUser(userId);
}
