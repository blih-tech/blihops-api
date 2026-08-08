import { prisma } from '../../../shared/db/prisma.js';

export const insightDetailInclude = {
  category: true,
  tags: { include: { tag: true } },
} as const;

export function findPublishedInsights(page: number, pageSize: number) {
  return Promise.all([
    prisma.insight.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: insightDetailInclude,
    }),
    prisma.insight.count({ where: { status: 'PUBLISHED' } }),
  ]);
}

export function findPublishedInsightBySlug(slug: string) {
  return prisma.insight.findFirst({
    where: {
      status: 'PUBLISHED',
      OR: [
        { content: { path: ['en', 'slug'], equals: slug } },
        { content: { path: ['de', 'slug'], equals: slug } },
      ],
    },
    include: insightDetailInclude,
  });
}
