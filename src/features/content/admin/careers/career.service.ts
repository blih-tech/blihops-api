import {
  ContentSlugTakenError,
  NotFoundError,
} from '../../../../shared/errors/httpErrors.js';
import {
  isRecordNotFound,
  isUniqueViolation,
} from '../../common/prismaErrors.js';
import type {
  CareerDetail,
  CareerListItem,
} from '../../careers/career.schema.js';
import { toCareerDetail } from '../../careers/career.service.js';
import {
  createCareerRecord,
  deleteCareerRecord,
  findAdminCareers,
  findCareerById,
  findCareerBySlug,
  updateCareerRecord,
} from './career.repository.js';
import type {
  CreateCareerPayload,
  PatchCareerPayload,
} from './career.schema.js';

function toListItem(career: {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  employmentType: string;
  summary: string;
  createdAt: Date;
}): CareerListItem {
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

export async function listAdminCareers(params: {
  page: number;
  pageSize: number;
  isActive?: boolean;
}): Promise<{ items: CareerListItem[]; total: number }> {
  const where = {
    ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
  };
  const [careers, total] = await findAdminCareers(
    where,
    params.page,
    params.pageSize,
  );
  return { items: careers.map(toListItem), total };
}

export async function getAdminCareer(id: string): Promise<CareerDetail> {
  const career = await findCareerById(id);
  if (career === null) {
    throw new NotFoundError('Career role not found');
  }
  return toCareerDetail(career);
}

export async function createCareer(
  payload: CreateCareerPayload,
): Promise<CareerDetail> {
  const existing = await findCareerBySlug(payload.slug);
  if (existing !== null) {
    throw new ContentSlugTakenError(
      'A career role with this slug already exists',
    );
  }

  try {
    const career = await createCareerRecord(payload);
    return toCareerDetail(career);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ContentSlugTakenError(
        'A career role with this slug already exists',
      );
    }
    throw err;
  }
}

export async function updateCareer(
  id: string,
  payload: PatchCareerPayload,
): Promise<CareerDetail> {
  const existing = await findCareerById(id);
  if (existing === null) {
    throw new NotFoundError('Career role not found');
  }

  if (payload.slug !== undefined) {
    const slugTaken = await findCareerBySlug(payload.slug);
    if (slugTaken !== null && slugTaken.id !== id) {
      throw new ContentSlugTakenError(
        'A career role with this slug already exists',
      );
    }
  }

  const data: {
    title?: string;
    slug?: string;
    department?: string;
    location?: string;
    employmentType?: string;
    summary?: string;
    overview?: string[];
    responsibilities?: string[];
    requirements?: string[];
    isActive?: boolean;
  } = {};
  if (payload.title !== undefined) data.title = payload.title;
  if (payload.slug !== undefined) data.slug = payload.slug;
  if (payload.department !== undefined) data.department = payload.department;
  if (payload.location !== undefined) data.location = payload.location;
  if (payload.employmentType !== undefined) {
    data.employmentType = payload.employmentType;
  }
  if (payload.summary !== undefined) data.summary = payload.summary;
  if (payload.overview !== undefined) data.overview = payload.overview;
  if (payload.responsibilities !== undefined) {
    data.responsibilities = payload.responsibilities;
  }
  if (payload.requirements !== undefined) {
    data.requirements = payload.requirements;
  }
  if (payload.isActive !== undefined) data.isActive = payload.isActive;

  try {
    const career = await updateCareerRecord(id, data);
    return toCareerDetail(career);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ContentSlugTakenError(
        'A career role with this slug already exists',
      );
    }
    if (isRecordNotFound(err)) {
      throw new NotFoundError('Career role not found');
    }
    throw err;
  }
}

export async function deleteCareer(id: string): Promise<void> {
  const existing = await findCareerById(id);
  if (existing === null) {
    throw new NotFoundError('Career role not found');
  }

  try {
    await deleteCareerRecord(id);
  } catch (err) {
    if (isRecordNotFound(err)) {
      throw new NotFoundError('Career role not found');
    }
    throw err;
  }
}
