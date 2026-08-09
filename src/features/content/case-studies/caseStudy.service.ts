import type { Prisma } from '../../../generated/prisma/client.js';
import { NotFoundError } from '../../../shared/errors/httpErrors.js';
import type {
  CaseStudyContent,
  CaseStudyDetail,
  CaseStudyListItem,
} from './caseStudy.schema.js';
import {
  caseStudyDetailInclude,
  findPublishedCaseStudyBySlug,
  findPublishedCaseStudies,
} from './caseStudy.repository.js';

type CaseStudyWithRelations = Prisma.CaseStudyGetPayload<{
  include: typeof caseStudyDetailInclude;
}>;

export { type CaseStudyWithRelations };

function toCaseStudyDetail(caseStudy: CaseStudyWithRelations): CaseStudyDetail {
  return {
    id: caseStudy.id,
    client: caseStudy.client,
    category:
      caseStudy.category === null
        ? null
        : { id: caseStudy.category.id, name: caseStudy.category.name },
    media: caseStudy.media as CaseStudyDetail['media'],
    status: caseStudy.status,
    tags: caseStudy.tags.map((row) => ({
      id: row.tag.id,
      name: row.tag.name,
    })),
    content: caseStudy.content as CaseStudyContent,
    createdAt: caseStudy.createdAt.toISOString(),
    updatedAt: caseStudy.updatedAt.toISOString(),
  };
}

export { toCaseStudyDetail };

function toCaseStudyListItem(
  caseStudy: CaseStudyWithRelations,
): CaseStudyListItem {
  const content = caseStudy.content as CaseStudyContent;
  return {
    id: caseStudy.id,
    slugs: {
      en: content.en?.slug ?? '',
      de: content.de?.slug ?? '',
    },
    titles: {
      en: content.en?.title ?? '',
      de: content.de?.title ?? '',
    },
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
    tags: caseStudy.tags.map((row) => ({
      id: row.tag.id,
      name: row.tag.name,
    })),
    createdAt: caseStudy.createdAt.toISOString(),
  };
}

export { toCaseStudyListItem };

export async function listPublicCaseStudies(
  page: number,
  pageSize: number,
): Promise<{ items: CaseStudyListItem[]; total: number }> {
  const [caseStudies, total] = await findPublishedCaseStudies(page, pageSize);
  return { items: caseStudies.map(toCaseStudyListItem), total };
}

export async function getPublicCaseStudyBySlug(
  slug: string,
): Promise<CaseStudyDetail> {
  const caseStudy = await findPublishedCaseStudyBySlug(slug);
  if (caseStudy === null) {
    throw new NotFoundError('Case study not found');
  }
  return toCaseStudyDetail(caseStudy);
}
