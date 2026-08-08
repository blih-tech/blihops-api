import { prisma } from '../../../shared/db/prisma.js';

export async function isCaseStudySlugTaken(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const found = await prisma.caseStudy.findFirst({
    where: {
      OR: [
        { content: { path: ['en', 'slug'], equals: slug } },
        { content: { path: ['de', 'slug'], equals: slug } },
      ],
      ...(excludeId !== undefined ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });
  return found !== null;
}

export async function isInsightSlugTaken(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const found = await prisma.insight.findFirst({
    where: {
      OR: [
        { content: { path: ['en', 'slug'], equals: slug } },
        { content: { path: ['de', 'slug'], equals: slug } },
      ],
      ...(excludeId !== undefined ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });
  return found !== null;
}
