import { Prisma } from '../../../../generated/prisma/client.js';
import { prisma } from '../../../../shared/db/prisma.js';
import { caseStudyDetailInclude } from '../../case-studies/caseStudy.repository.js';

export type CaseStudyRecord = Prisma.CaseStudyGetPayload<{
  include: typeof caseStudyDetailInclude;
}>;

export function findAdminCaseStudies(
  where: { status?: 'DRAFT' | 'PUBLISHED'; categoryId?: string },
  page: number,
  pageSize: number,
) {
  return Promise.all([
    prisma.caseStudy.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: caseStudyDetailInclude,
    }),
    prisma.caseStudy.count({ where }),
  ]);
}

export function findCaseStudyById(id: string) {
  return prisma.caseStudy.findUnique({
    where: { id },
    include: caseStudyDetailInclude,
  });
}

export function createCaseStudyRecord(data: {
  client: string;
  categoryId: string | null;
  media: Prisma.InputJsonValue;
  content: Prisma.InputJsonValue;
}) {
  return prisma.caseStudy.create({
    data,
    include: caseStudyDetailInclude,
  });
}

export function updateCaseStudyRecord(
  id: string,
  data: {
    client?: string;
    categoryId?: string | null;
    media?: Prisma.InputJsonValue;
    content?: Prisma.InputJsonValue;
  },
) {
  return prisma.caseStudy.update({
    where: { id },
    data,
    include: caseStudyDetailInclude,
  });
}

export function setCaseStudyStatus(id: string, status: 'DRAFT' | 'PUBLISHED') {
  return prisma.caseStudy.update({
    where: { id },
    data: { status },
    include: caseStudyDetailInclude,
  });
}

export function deleteCaseStudyRecord(id: string) {
  return prisma.caseStudy.delete({ where: { id } });
}

export function replaceCaseStudyTags(caseStudyId: string, tagIds: string[]) {
  return prisma.$transaction([
    prisma.caseStudyTag.deleteMany({ where: { caseStudyId } }),
    ...(tagIds.length > 0
      ? [
          prisma.caseStudyTag.createMany({
            data: tagIds.map((tagId) => ({ caseStudyId, tagId })),
          }),
        ]
      : []),
  ]);
}
