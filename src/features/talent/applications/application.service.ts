import type { Prisma } from '../../../generated/prisma/client.js';
import { NotFoundError } from '../../../shared/errors/httpErrors.js';
import type {
  CreateTalentApplicationPayload,
  TalentApplicationCreatedResponse,
  TalentApplicationDetail,
  TalentApplicationListItem,
} from './application.schema.js';
import {
  createTalentApplicationRecord,
  findTalentApplicationById,
  findTalentApplications,
  isRecordNotFound,
  updateTalentApplicationNotes as repoUpdateNotes,
  updateTalentApplicationStatus as repoUpdateStatus,
} from './application.repository.js';

function normalizeOptionalUrl(value: string | undefined): string | null {
  if (value === undefined || value === '') return null;
  return value;
}

function toListItem(row: {
  id: string;
  status: string;
  fullName: string;
  workEmail: string;
  phone: string;
  country: string;
  city: string;
  primaryRole: string;
  yearsExperience: number;
  createdAt: Date;
  updatedAt: Date;
}): TalentApplicationListItem {
  return {
    id: row.id,
    status: row.status as never,
    fullName: row.fullName,
    workEmail: row.workEmail,
    phone: row.phone,
    country: row.country,
    city: row.city,
    primaryRole: row.primaryRole,
    yearsExperience: row.yearsExperience,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDetail(
  row: NonNullable<Awaited<ReturnType<typeof findTalentApplicationById>>>,
): TalentApplicationDetail {
  return {
    id: row.id,
    status: row.status,
    fullName: row.fullName,
    workEmail: row.workEmail,
    phone: row.phone,
    country: row.country,
    city: row.city,
    primaryRole: row.primaryRole,
    yearsExperience: row.yearsExperience,
    techStack: row.techStack,
    secondarySkills: row.secondarySkills,
    portfolioUrl: row.portfolioUrl,
    githubUrl: row.githubUrl,
    linkedinUrl: row.linkedinUrl,
    resumeFileKey: row.resumeFileKey,
    completionPhotoKey: row.completionPhotoKey,
    completionShortBio: row.completionShortBio,
    completionProfessionalHeadline: row.completionProfessionalHeadline,
    completionSubmittedAt: row.completionSubmittedAt?.toISOString() ?? null,
    internalNotes: row.internalNotes,
    talentProfileId: row.talentProfile?.id ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createTalentApplication(
  payload: CreateTalentApplicationPayload,
): Promise<TalentApplicationCreatedResponse> {
  const row = await createTalentApplicationRecord({
    fullName: payload.fullName,
    workEmail: payload.workEmail,
    phone: payload.phone,
    country: payload.country,
    city: payload.city,
    primaryRole: payload.primaryRole,
    techStack: payload.techStack,
    secondarySkills: payload.secondarySkills ?? [],
    yearsExperience: payload.yearsExperience,
    portfolioUrl: normalizeOptionalUrl(payload.portfolioUrl),
    githubUrl: normalizeOptionalUrl(payload.githubUrl),
    linkedinUrl: normalizeOptionalUrl(payload.linkedinUrl),
    resumeFileKey: payload.resumeFileKey,
  });
  return { id: row.id, status: row.status as never };
}

export async function listTalentApplications(filters: {
  status?: string | undefined;
  q?: string | undefined;
  page: number;
  pageSize: number;
}): Promise<{ items: TalentApplicationListItem[]; total: number }> {
  const where: Prisma.TalentApplicationWhereInput = {};
  if (filters.status !== undefined) where.status = filters.status as never;
  if (filters.q !== undefined && filters.q.length > 0) {
    where.OR = [
      { fullName: { contains: filters.q, mode: 'insensitive' } },
      { workEmail: { contains: filters.q, mode: 'insensitive' } },
      { primaryRole: { contains: filters.q, mode: 'insensitive' } },
    ];
  }
  const [rows, total] = await findTalentApplications(
    where,
    filters.page,
    filters.pageSize,
  );
  return { items: rows.map(toListItem), total };
}

export async function getTalentApplication(
  id: string,
): Promise<TalentApplicationDetail> {
  const row = await findTalentApplicationById(id);
  if (row === null) {
    throw new NotFoundError('Talent application not found');
  }
  return toDetail(row);
}

export async function updateTalentApplicationStatus(
  id: string,
  status: string,
): Promise<TalentApplicationDetail> {
  try {
    const updated = await repoUpdateStatus(id, status);
    const row = await findTalentApplicationById(updated.id);
    // find after update to include talentProfile
    if (row === null) throw new NotFoundError('Talent application not found');
    return toDetail(row);
  } catch (err) {
    if (isRecordNotFound(err))
      throw new NotFoundError('Talent application not found');
    throw err;
  }
}

export async function updateTalentApplicationNotes(
  id: string,
  internalNotes: string,
): Promise<TalentApplicationDetail> {
  try {
    await repoUpdateNotes(id, internalNotes);
    const row = await findTalentApplicationById(id);
    if (row === null) throw new NotFoundError('Talent application not found');
    return toDetail(row);
  } catch (err) {
    if (isRecordNotFound(err))
      throw new NotFoundError('Talent application not found');
    throw err;
  }
}
