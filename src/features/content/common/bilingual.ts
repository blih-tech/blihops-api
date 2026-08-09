import type { z } from 'zod';

import {
  NotFoundError,
  ValidationError,
} from '../../../shared/errors/httpErrors.js';
import type { ErrorDetail } from '../../../shared/types/response.js';

type BilingualContent = { en?: unknown; de?: unknown };

export async function publishBilingualRecord<TRecord, TDetail>(params: {
  id: string;
  notFoundMessage: string;
  findById: (id: string) => Promise<TRecord | null>;
  contentOf: (record: TRecord) => BilingualContent;
  fullLocaleSchema: z.ZodTypeAny;
  sharedFieldIssues: (record: TRecord) => ErrorDetail[];
  isSlugTaken: (slug: string, excludeId?: string) => Promise<boolean>;
  setPublished: (id: string) => Promise<TRecord>;
  toDetail: (record: TRecord) => TDetail;
}): Promise<TDetail> {
  const record = await params.findById(params.id);
  if (record === null) {
    throw new NotFoundError(params.notFoundMessage);
  }

  const content = params.contentOf(record);
  const issues: ErrorDetail[] = [];

  for (const locale of ['en', 'de'] as const) {
    const parsed = params.fullLocaleSchema.safeParse(content[locale]);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.');
        issues.push({
          path: `${locale}.${path}`,
          message: issue.message,
        });
      }
    }
  }

  issues.push(...params.sharedFieldIssues(record));

  if (issues.length === 0) {
    for (const locale of ['en', 'de'] as const) {
      const localeContent = content[locale] as { slug?: string } | undefined;
      const slug = localeContent?.slug;
      if (slug !== undefined && (await params.isSlugTaken(slug, params.id))) {
        issues.push({
          path: `${locale}.slug`,
          message: 'This slug is already in use by another record',
        });
      }
    }
  }

  if (issues.length > 0) {
    throw new ValidationError('Publish validation failed', issues);
  }

  const updated = await params.setPublished(params.id);
  return params.toDetail(updated);
}
