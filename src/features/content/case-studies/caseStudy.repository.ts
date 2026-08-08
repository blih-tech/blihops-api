import { prisma } from '../../../shared/db/prisma.js';

export const caseStudyDetailInclude = {
  category: true,
  tags: { include: { tag: true } },
} as const;

export function findPublishedCaseStudies(page: number, pageSize: number) {
  return Promise.all([
    prisma.caseStudy.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: caseStudyDetailInclude,
    }),
    prisma.caseStudy.count({ where: { status: 'PUBLISHED' } }),
  ]);
}

export function findPublishedCaseStudyBySlug(slug: string) {
  return prisma.caseStudy.findFirst({
    where: {
      status: 'PUBLISHED',
      OR: [
        { content: { path: ['en', 'slug'], equals: slug } },
        { content: { path: ['de', 'slug'], equals: slug } },
      ],
    },
    include: caseStudyDetailInclude,
  });
}
