import { Prisma } from '../../../../generated/prisma/client.js';
import {
  ContentInvalidLocaleError,
  NotFoundError,
} from '../../../../shared/errors/httpErrors.js';
import { publishBilingualRecord } from '../../common/bilingual.js';
import { isInsightSlugTaken } from '../../common/helpers.js';
import { sanitizeRichText } from '../../common/html.js';
import { isRecordNotFound } from '../../common/prismaErrors.js';
import { validateTagsExist } from '../../common/tagRepository.js';
import type {
  InsightContent,
  InsightDetail,
  InsightLocaleContent,
} from '../../insights/insight.schema.js';
import {
  toInsightDetail,
  toInsightListItem,
} from '../../insights/insight.service.js';
import {
  createInsightRecord,
  deleteInsightRecord,
  findAdminInsights,
  findInsightById,
  replaceInsightTags,
  setInsightStatus,
  type InsightRecord,
  updateInsightRecord,
} from './insight.repository.js';
import {
  fullInsightLocaleContentSchema,
  type AdminInsightListItem,
  type CreateInsightPayload,
  type PartialInsightLocaleContent,
  type PatchInsightPayload,
} from './insight.schema.js';

function sanitizePartialContent(
  content: PartialInsightLocaleContent,
): PartialInsightLocaleContent {
  return {
    ...content,
    body:
      content.body === undefined
        ? undefined
        : content.body.map((section) => ({
            section: section.section,
            content: sanitizeRichText(section.content),
          })),
  };
}

function toListItem(insight: InsightRecord): AdminInsightListItem {
  const content = insight.content as InsightContent;
  const isBodyComplete = (locale: keyof InsightContent): boolean => {
    const body = content[locale]?.body;
    return Boolean(
      Array.isArray(body) &&
      body.length > 0 &&
      body.every(
        (section) =>
          typeof section.section === 'string' &&
          section.section.trim().length > 0 &&
          typeof section.content === 'string' &&
          section.content.trim().length > 0,
      ),
    );
  };
  return {
    ...toInsightListItem(insight),
    status: insight.status,
    bodyComplete: {
      en: isBodyComplete('en'),
      de: isBodyComplete('de'),
    },
  };
}

export async function listAdminInsights(params: {
  page: number;
  pageSize: number;
  status?: 'DRAFT' | 'PUBLISHED';
  categoryId?: string;
}): Promise<{ items: AdminInsightListItem[]; total: number }> {
  const where = {
    ...(params.status !== undefined ? { status: params.status } : {}),
    ...(params.categoryId !== undefined
      ? { categoryId: params.categoryId }
      : {}),
  };
  const [insights, total] = await findAdminInsights(
    where,
    params.page,
    params.pageSize,
  );
  return { items: insights.map(toListItem), total };
}

export async function getAdminInsight(id: string): Promise<InsightDetail> {
  const insight = await findInsightById(id);
  if (insight === null) {
    throw new NotFoundError('Insight not found');
  }
  return toInsightDetail(insight);
}

export async function createInsight(
  payload: CreateInsightPayload,
): Promise<InsightDetail> {
  if (payload.tags !== undefined) {
    await validateTagsExist(payload.tags);
  }

  const content: InsightContent = {};
  if (payload.content?.en !== undefined) {
    content.en = sanitizePartialContent(
      payload.content.en,
    ) as InsightLocaleContent;
  }
  if (payload.content?.de !== undefined) {
    content.de = sanitizePartialContent(
      payload.content.de,
    ) as InsightLocaleContent;
  }

  const insight = await createInsightRecord({
    author: payload.author,
    categoryId: payload.categoryId ?? null,
    readTimeMinutes: payload.readTimeMinutes ?? 0,
    media: payload.media ?? { type: 'image', url: '' },
    content,
  });

  if (payload.tags !== undefined) {
    await replaceInsightTags(insight.id, payload.tags);
    const withTags = await findInsightById(insight.id);
    if (withTags !== null) {
      return toInsightDetail(withTags);
    }
  }

  return toInsightDetail(insight);
}

export async function updateInsight(
  id: string,
  payload: PatchInsightPayload,
): Promise<InsightDetail> {
  const existing = await findInsightById(id);
  if (existing === null) {
    throw new NotFoundError('Insight not found');
  }

  if ('locale' in payload) {
    if (payload.locale !== 'en' && payload.locale !== 'de') {
      throw new ContentInvalidLocaleError();
    }
    const content = existing.content as InsightContent;
    const nextContent: InsightContent = {
      ...content,
      [payload.locale]: sanitizePartialContent(
        payload.content,
      ) as InsightLocaleContent,
    };
    const updated = await updateInsightRecord(id, { content: nextContent });
    return toInsightDetail(updated);
  }

  const data: {
    author?: string;
    categoryId?: string | null;
    readTimeMinutes?: number;
    media?: Prisma.InputJsonValue;
  } = {};
  if (payload.author !== undefined) data.author = payload.author;
  if (payload.categoryId !== undefined) data.categoryId = payload.categoryId;
  if (payload.readTimeMinutes !== undefined) {
    data.readTimeMinutes = payload.readTimeMinutes;
  }
  if (payload.media !== undefined) {
    data.media =
      payload.media === null ? { type: 'image', url: '' } : payload.media;
  }

  let updated: InsightRecord = existing;
  if (Object.keys(data).length > 0) {
    updated = await updateInsightRecord(id, data);
  }

  if (payload.tags !== undefined) {
    await validateTagsExist(payload.tags);
    await replaceInsightTags(id, payload.tags);
    const withTags = await findInsightById(id);
    if (withTags !== null) {
      updated = withTags;
    }
  }

  return toInsightDetail(updated);
}

export async function publishInsight(id: string): Promise<InsightDetail> {
  return publishBilingualRecord({
    id,
    notFoundMessage: 'Insight not found',
    findById: findInsightById,
    contentOf: (insight) => insight.content as InsightContent,
    fullLocaleSchema: fullInsightLocaleContentSchema,
    sharedFieldIssues: (insight) => {
      const issues = [];
      if (insight.author.trim().length === 0) {
        issues.push({ path: 'author', message: 'Author is required' });
      }
      if (insight.categoryId === null) {
        issues.push({ path: 'categoryId', message: 'Category is required' });
      }
      if (insight.readTimeMinutes === null || insight.readTimeMinutes < 1) {
        issues.push({
          path: 'readTimeMinutes',
          message: 'Read time must be at least 1 minute',
        });
      }
      const media = insight.media as { url?: string } | null;
      if (
        media === null ||
        media.url === undefined ||
        media.url.trim().length === 0
      ) {
        issues.push({ path: 'media.url', message: 'Media URL is required' });
      }
      return issues;
    },
    isSlugTaken: isInsightSlugTaken,
    setPublished: (recordId) => setInsightStatus(recordId, 'PUBLISHED'),
    toDetail: toInsightDetail,
  });
}

export async function unpublishInsight(id: string): Promise<InsightDetail> {
  const existing = await findInsightById(id);
  if (existing === null) {
    throw new NotFoundError('Insight not found');
  }

  const updated = await setInsightStatus(id, 'DRAFT');
  return toInsightDetail(updated);
}

export async function deleteInsight(id: string): Promise<void> {
  const existing = await findInsightById(id);
  if (existing === null) {
    throw new NotFoundError('Insight not found');
  }

  try {
    await deleteInsightRecord(id);
  } catch (err) {
    if (isRecordNotFound(err)) {
      throw new NotFoundError('Insight not found');
    }
    throw err;
  }
}
