import { Prisma } from '../../../../generated/prisma/client.js';
import { prisma } from '../../../../shared/db/prisma.js';
import { insightDetailInclude } from '../../insights/insight.repository.js';

export type InsightRecord = Prisma.InsightGetPayload<{
  include: typeof insightDetailInclude;
}>;

export function findAdminInsights(
  where: { status?: 'DRAFT' | 'PUBLISHED'; categoryId?: string },
  page: number,
  pageSize: number,
) {
  return Promise.all([
    prisma.insight.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: insightDetailInclude,
    }),
    prisma.insight.count({ where }),
  ]);
}

export function findInsightById(id: string) {
  return prisma.insight.findUnique({
    where: { id },
    include: insightDetailInclude,
  });
}

export function createInsightRecord(data: {
  author: string;
  categoryId: string | null;
  readTimeMinutes: number;
  media: Prisma.InputJsonValue;
  content: Prisma.InputJsonValue;
}) {
  return prisma.insight.create({
    data,
    include: insightDetailInclude,
  });
}

export function updateInsightRecord(
  id: string,
  data: {
    author?: string;
    categoryId?: string | null;
    readTimeMinutes?: number;
    media?: Prisma.InputJsonValue;
    content?: Prisma.InputJsonValue;
  },
) {
  return prisma.insight.update({
    where: { id },
    data,
    include: insightDetailInclude,
  });
}

export function setInsightStatus(id: string, status: 'DRAFT' | 'PUBLISHED') {
  return prisma.insight.update({
    where: { id },
    data: { status },
    include: insightDetailInclude,
  });
}

export function deleteInsightRecord(id: string) {
  return prisma.insight.delete({ where: { id } });
}

export function findInsightTagsByIds(ids: string[]) {
  return prisma.tag.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
}

export function replaceInsightTags(insightId: string, tagIds: string[]) {
  return prisma.$transaction([
    prisma.insightTag.deleteMany({ where: { insightId } }),
    ...(tagIds.length > 0
      ? [
          prisma.insightTag.createMany({
            data: tagIds.map((tagId) => ({ insightId, tagId })),
          }),
        ]
      : []),
  ]);
}
