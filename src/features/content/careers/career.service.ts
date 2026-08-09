import type { CareerRole } from '../../../generated/prisma/client.js';
import { NotFoundError } from '../../../shared/errors/httpErrors.js';
import type { CareerDetail, CareerListItem } from './career.schema.js';
import {
  findActiveCareerBySlug,
  findActiveCareers,
} from './career.repository.js';

function toCareerDetail(career: CareerRole): CareerDetail {
  return {
    id: career.id,
    title: career.title,
    slug: career.slug,
    department: career.department,
    location: career.location,
    employmentType: career.employmentType,
    summary: career.summary,
    overview: career.overview,
    responsibilities: career.responsibilities,
    requirements: career.requirements,
    isActive: career.isActive,
    createdAt: career.createdAt.toISOString(),
    updatedAt: career.updatedAt.toISOString(),
  };
}

export { toCareerDetail };

function toCareerListItem(career: CareerRole): CareerListItem {
  return {
    id: career.id,
    title: career.title,
    slug: career.slug,
    department: career.department,
    location: career.location,
    employmentType: career.employmentType,
    summary: career.summary,
    createdAt: career.createdAt.toISOString(),
  };
}

export async function listPublicCareers(
  page: number,
  pageSize: number,
): Promise<{ items: CareerListItem[]; total: number }> {
  const [careers, total] = await findActiveCareers(page, pageSize);
  return { items: careers.map(toCareerListItem), total };
}

export async function getPublicCareerBySlug(
  slug: string,
): Promise<CareerDetail> {
  const career = await findActiveCareerBySlug(slug);
  if (career === null) {
    throw new NotFoundError('Career role not found');
  }
  return toCareerDetail(career);
}
