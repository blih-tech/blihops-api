import { NotFoundError } from '../../../../shared/errors/httpErrors.js';
import { Prisma } from '../../../../generated/prisma/client.js';
import { publishBilingualRecord } from '../../common/bilingual.js';
import { isCaseStudySlugTaken } from '../../common/helpers.js';
import { sanitizeRichText } from '../../common/html.js';
import { isRecordNotFound } from '../../common/prismaErrors.js';
import { validateTagsExist } from '../../common/tagRepository.js';
import type {
  CaseStudyContent,
  CaseStudyDetail,
  CaseStudyListItem,
  CaseStudyLocaleContent,
} from '../../case-studies/caseStudy.schema.js';
import { toCaseStudyDetail } from '../../case-studies/caseStudy.service.js';
import {
  createCaseStudyRecord,
  deleteCaseStudyRecord,
  findAdminCaseStudies,
  findCaseStudyById,
  replaceCaseStudyTags,
  setCaseStudyStatus,
  type CaseStudyRecord,
  updateCaseStudyRecord,
} from './caseStudy.repository.js';
import {
  fullLocaleContentSchema,
  type CreateCaseStudyPayload,
  type PartialLocaleContent,
  type PatchCaseStudyPayload,
} from './caseStudy.schema.js';

function sanitizePartialContent(
  content: PartialLocaleContent,
): PartialLocaleContent {
  const body = content.body;
  return {
    ...content,
    body:
      body === undefined
        ? undefined
        : {
            challenge:
              body.challenge === undefined
                ? undefined
                : sanitizeRichText(body.challenge),
            approach:
              body.approach === undefined
                ? undefined
                : sanitizeRichText(body.approach),
            outcome:
              body.outcome === undefined
                ? undefined
                : sanitizeRichText(body.outcome),
          },
  };
}

function toListItem(caseStudy: CaseStudyRecord): CaseStudyListItem {
  const content = caseStudy.content as CaseStudyContent;
  return {
    id: caseStudy.id,
    slugs: { en: content.en?.slug ?? '', de: content.de?.slug ?? '' },
    titles: { en: content.en?.title ?? '', de: content.de?.title ?? '' },
    summaries: {
      en: content.en?.summary ?? '',
      de: content.de?.summary ?? '',
    },
    client: caseStudy.client,
    category:
      caseStudy.category === null
        ? null
        : { id: caseStudy.category.id, name: caseStudy.category.name },
    media: caseStudy.media as CaseStudyListItem['media'],
    tags: caseStudy.tags.map((row) => ({ id: row.tag.id, name: row.tag.name })),
    createdAt: caseStudy.createdAt.toISOString(),
  };
}

export async function listAdminCaseStudies(params: {
  page: number;
  pageSize: number;
  status?: 'DRAFT' | 'PUBLISHED';
  categoryId?: string;
}): Promise<{ items: CaseStudyListItem[]; total: number }> {
  const where = {
    ...(params.status !== undefined ? { status: params.status } : {}),
    ...(params.categoryId !== undefined
      ? { categoryId: params.categoryId }
      : {}),
  };
  const [caseStudies, total] = await findAdminCaseStudies(
    where,
    params.page,
    params.pageSize,
  );
  return { items: caseStudies.map(toListItem), total };
}

export async function getAdminCaseStudy(id: string): Promise<CaseStudyDetail> {
  const caseStudy = await findCaseStudyById(id);
  if (caseStudy === null) {
    throw new NotFoundError('Case study not found');
  }
  return toCaseStudyDetail(caseStudy);
}

export async function createCaseStudy(
  payload: CreateCaseStudyPayload,
): Promise<CaseStudyDetail> {
  if (payload.tags !== undefined) {
    await validateTagsExist(payload.tags);
  }

  const content: CaseStudyContent = {};
  if (payload.content?.en !== undefined) {
    content.en = sanitizePartialContent(
      payload.content.en,
    ) as CaseStudyLocaleContent;
  }
  if (payload.content?.de !== undefined) {
    content.de = sanitizePartialContent(
      payload.content.de,
    ) as CaseStudyLocaleContent;
  }

  const caseStudy = await createCaseStudyRecord({
    client: payload.client,
    categoryId: payload.categoryId ?? null,
    media: payload.media ?? { type: 'image', url: '' },
    content,
  });

  if (payload.tags !== undefined) {
    await replaceCaseStudyTags(caseStudy.id, payload.tags);
    const withTags = await findCaseStudyById(caseStudy.id);
    if (withTags !== null) {
      return toCaseStudyDetail(withTags);
    }
  }

  return toCaseStudyDetail(caseStudy);
}

export async function updateCaseStudy(
  id: string,
  payload: PatchCaseStudyPayload,
): Promise<CaseStudyDetail> {
  const existing = await findCaseStudyById(id);
  if (existing === null) {
    throw new NotFoundError('Case study not found');
  }

  if ('locale' in payload) {
    const content = existing.content as CaseStudyContent;
    const nextContent: CaseStudyContent = {
      ...content,
      [payload.locale]: sanitizePartialContent(
        payload.content,
      ) as CaseStudyLocaleContent,
    };
    const updated = await updateCaseStudyRecord(id, { content: nextContent });
    return toCaseStudyDetail(updated);
  }

  const data: {
    client?: string;
    categoryId?: string | null;
    media?: Prisma.InputJsonValue;
  } = {};
  if (payload.client !== undefined) data.client = payload.client;
  if (payload.categoryId !== undefined) data.categoryId = payload.categoryId;
  if (payload.media !== undefined) data.media = payload.media;

  let updated: CaseStudyRecord = existing;
  if (Object.keys(data).length > 0) {
    updated = await updateCaseStudyRecord(id, data);
  }

  if (payload.tags !== undefined) {
    await validateTagsExist(payload.tags);
    await replaceCaseStudyTags(id, payload.tags);
    const withTags = await findCaseStudyById(id);
    if (withTags !== null) {
      updated = withTags;
    }
  }

  return toCaseStudyDetail(updated);
}

export async function publishCaseStudy(id: string): Promise<CaseStudyDetail> {
  return publishBilingualRecord({
    id,
    notFoundMessage: 'Case study not found',
    findById: findCaseStudyById,
    contentOf: (caseStudy) => caseStudy.content as CaseStudyContent,
    fullLocaleSchema: fullLocaleContentSchema,
    sharedFieldIssues: (caseStudy) => {
      const issues = [];
      if (caseStudy.client.trim().length === 0) {
        issues.push({ path: 'client', message: 'Client is required' });
      }
      if (caseStudy.categoryId === null) {
        issues.push({ path: 'categoryId', message: 'Category is required' });
      }
      const media = caseStudy.media as { url?: string } | null;
      if (
        media === null ||
        media.url === undefined ||
        media.url.trim().length === 0
      ) {
        issues.push({ path: 'media.url', message: 'Media URL is required' });
      }
      return issues;
    },
    isSlugTaken: isCaseStudySlugTaken,
    setPublished: (recordId) => setCaseStudyStatus(recordId, 'PUBLISHED'),
    toDetail: toCaseStudyDetail,
  });
}

export async function unpublishCaseStudy(id: string): Promise<CaseStudyDetail> {
  const existing = await findCaseStudyById(id);
  if (existing === null) {
    throw new NotFoundError('Case study not found');
  }

  const updated = await setCaseStudyStatus(id, 'DRAFT');
  return toCaseStudyDetail(updated);
}

export async function deleteCaseStudy(id: string): Promise<void> {
  const existing = await findCaseStudyById(id);
  if (existing === null) {
    throw new NotFoundError('Case study not found');
  }

  try {
    await deleteCaseStudyRecord(id);
  } catch (err) {
    if (isRecordNotFound(err)) {
      throw new NotFoundError('Case study not found');
    }
    throw err;
  }
}
