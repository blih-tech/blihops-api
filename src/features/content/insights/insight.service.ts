import type { Prisma } from '../../../generated/prisma/client.js';
import { NotFoundError } from '../../../shared/errors/httpErrors.js';
import type {
  InsightContent,
  InsightDetail,
  InsightListItem,
} from './insight.schema.js';
import {
  findPublishedInsightBySlug,
  findPublishedInsights,
  insightDetailInclude,
} from './insight.repository.js';

type InsightWithRelations = Prisma.InsightGetPayload<{
  include: typeof insightDetailInclude;
}>;

export { type InsightWithRelations };

function toInsightDetail(insight: InsightWithRelations): InsightDetail {
  return {
    id: insight.id,
    author: insight.author,
    readTimeMinutes: insight.readTimeMinutes,
    category:
      insight.category === null
        ? null
        : { id: insight.category.id, name: insight.category.name },
    media: insight.media as InsightDetail['media'],
    status: insight.status,
    tags: insight.tags.map((row) => ({ id: row.tag.id, name: row.tag.name })),
    content: insight.content as InsightContent,
    createdAt: insight.createdAt.toISOString(),
    updatedAt: insight.updatedAt.toISOString(),
  };
}

export { toInsightDetail };

function toInsightListItem(insight: InsightWithRelations): InsightListItem {
  const content = insight.content as InsightContent;
  return {
    id: insight.id,
    slugs: {
      en: content.en?.slug ?? '',
      de: content.de?.slug ?? '',
    },
    titles: {
      en: content.en?.title ?? '',
      de: content.de?.title ?? '',
    },
    excerpts: {
      en: content.en?.excerpt ?? '',
      de: content.de?.excerpt ?? '',
    },
    author: insight.author,
    readTimeMinutes: insight.readTimeMinutes,
    category:
      insight.category === null
        ? null
        : { id: insight.category.id, name: insight.category.name },
    media: insight.media as InsightListItem['media'],
    tags: insight.tags.map((row) => ({ id: row.tag.id, name: row.tag.name })),
    createdAt: insight.createdAt.toISOString(),
  };
}

export async function listPublicInsights(
  page: number,
  pageSize: number,
): Promise<{ items: InsightListItem[]; total: number }> {
  const [insights, total] = await findPublishedInsights(page, pageSize);
  return { items: insights.map(toInsightListItem), total };
}

export async function getPublicInsightBySlug(
  slug: string,
): Promise<InsightDetail> {
  const insight = await findPublishedInsightBySlug(slug);
  if (insight === null) {
    throw new NotFoundError('Insight not found');
  }
  return toInsightDetail(insight);
}
