import { prisma } from '../../../shared/db/prisma.js';

export function findActiveCareers(page: number, pageSize: number) {
  return Promise.all([
    prisma.careerRole.findMany({
      where: { isActive: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.careerRole.count({ where: { isActive: true } }),
  ]);
}

export function findActiveCareerBySlug(slug: string) {
  return prisma.careerRole.findFirst({
    where: { slug, isActive: true },
  });
}
