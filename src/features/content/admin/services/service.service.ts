import type { Prisma } from '../../../../generated/prisma/client.js';
import {
  ContentIncompleteError,
  ContentSlugTakenError,
  NotFoundError,
} from '../../../../shared/errors/httpErrors.js';
import type { ErrorDetail } from '../../../../shared/types/response.js';
import { isRecordNotFound } from '../../common/prismaErrors.js';
import type {
  ServiceContent,
  ServiceDetail,
} from '../../services/service.schema.js';
import { toServiceDetail } from '../../services/service.service.js';
import {
  createServiceRecord,
  deleteServiceRecord,
  findServiceById,
  findServiceBySlug,
  maxServiceDisplayOrder,
  updateServiceRecord,
} from './service.repository.js';
import {
  serviceAdminLocaleContentSchema,
  type CreateServicePayload,
  type PatchServicePayload,
} from './service.schema.js';

type ServiceForValidation = {
  icon: string;
  imageUrl: string;
  alt: string;
  content: ServiceContent;
};

function validateServiceCompleteness(
  record: ServiceForValidation,
): ErrorDetail[] {
  const issues: ErrorDetail[] = [];

  for (const locale of ['en', 'de'] as const) {
    const localeContent = record.content[locale];
    if (localeContent === undefined) {
      issues.push({
        path: locale,
        message: 'Locale content is required',
      });
      continue;
    }
    const parsed = serviceAdminLocaleContentSchema.safeParse(localeContent);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.');
        issues.push({ path: `${locale}.${path}`, message: issue.message });
      }
    }
  }

  for (const field of ['icon', 'imageUrl', 'alt'] as const) {
    if (record[field].trim().length === 0) {
      issues.push({ path: field, message: 'This field is required' });
    }
  }

  return issues;
}

async function assertSlugsFree(
  content: ServiceContent,
  excludeId?: string,
): Promise<void> {
  for (const locale of ['en', 'de'] as const) {
    const slug = content[locale]?.slug;
    if (
      slug !== undefined &&
      (await findServiceBySlug(slug, excludeId)) !== null
    ) {
      throw new ContentSlugTakenError(
        'A service with this slug already exists',
      );
    }
  }
}

export async function getAdminService(id: string): Promise<ServiceDetail> {
  const service = await findServiceById(id);
  if (service === null) {
    throw new NotFoundError('Service not found');
  }
  return toServiceDetail(service);
}

export async function createService(
  payload: CreateServicePayload,
): Promise<ServiceDetail> {
  const issues = validateServiceCompleteness({
    icon: payload.icon,
    imageUrl: payload.imageUrl,
    alt: payload.alt,
    content: payload.content,
  });
  if (issues.length > 0) {
    throw new ContentIncompleteError(
      'Service must be complete before it can go live',
      issues,
    );
  }

  await assertSlugsFree(payload.content);

  const displayOrder =
    payload.displayOrder ?? (await maxServiceDisplayOrder()) + 1;

  const service = await createServiceRecord({
    icon: payload.icon,
    imageUrl: payload.imageUrl,
    alt: payload.alt,
    displayOrder,
    content: payload.content,
  });
  return toServiceDetail(service);
}

export async function updateService(
  id: string,
  payload: PatchServicePayload,
): Promise<ServiceDetail> {
  const existing = await findServiceById(id);
  if (existing === null) {
    throw new NotFoundError('Service not found');
  }

  const data: {
    icon?: string;
    imageUrl?: string;
    alt?: string;
    displayOrder?: number;
    content?: Prisma.InputJsonValue;
  } = {};
  if (payload.icon !== undefined) data.icon = payload.icon;
  if (payload.imageUrl !== undefined) data.imageUrl = payload.imageUrl;
  if (payload.alt !== undefined) data.alt = payload.alt;
  if (payload.displayOrder !== undefined)
    data.displayOrder = payload.displayOrder;

  let nextContent: ServiceContent = { ...(existing.content as ServiceContent) };
  if (payload.locale !== undefined && payload.content !== undefined) {
    nextContent = { ...nextContent, [payload.locale]: payload.content };
    data.content = nextContent;
  }

  const merged: ServiceForValidation = {
    icon: data.icon ?? existing.icon,
    imageUrl: data.imageUrl ?? existing.imageUrl,
    alt: data.alt ?? existing.alt,
    content: nextContent,
  };

  const issues = validateServiceCompleteness(merged);
  if (issues.length > 0) {
    throw new ContentIncompleteError(
      'Service must stay complete to be saved',
      issues,
    );
  }

  await assertSlugsFree(nextContent, id);

  try {
    const service = await updateServiceRecord(id, data);
    return toServiceDetail(service);
  } catch (err) {
    if (isRecordNotFound(err)) {
      throw new NotFoundError('Service not found');
    }
    throw err;
  }
}

export async function deleteService(id: string): Promise<void> {
  const existing = await findServiceById(id);
  if (existing === null) {
    throw new NotFoundError('Service not found');
  }

  try {
    await deleteServiceRecord(id);
  } catch (err) {
    if (isRecordNotFound(err)) {
      throw new NotFoundError('Service not found');
    }
    throw err;
  }
}
