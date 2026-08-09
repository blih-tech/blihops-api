import { prisma } from '../../../../shared/db/prisma.js';

export function findAdminCareers(
  where: { isActive?: boolean },
  page: number,
  pageSize: number,
) {
  return Promise.all([
    prisma.careerRole.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.careerRole.count({ where }),
  ]);
}

export function findCareerById(id: string) {
  return prisma.careerRole.findUnique({ where: { id } });
}

export function findCareerBySlug(slug: string) {
  return prisma.careerRole.findUnique({ where: { slug } });
}

export function createCareerRecord(data: {
  title: string;
  slug: string;
  department: string;
  location: string;
  employmentType: string;
  summary: string;
  overview: string[];
  responsibilities: string[];
  requirements: string[];
}) {
  return prisma.careerRole.create({ data });
}

export function updateCareerRecord(
  id: string,
  data: {
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
  },
) {
  return prisma.careerRole.update({ where: { id }, data });
}

export function deleteCareerRecord(id: string) {
  return prisma.careerRole.delete({ where: { id } });
}
