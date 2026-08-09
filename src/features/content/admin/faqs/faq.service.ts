import { Prisma } from '../../../../generated/prisma/client.js';
import {
  NotFoundError,
  ValidationError,
} from '../../../../shared/errors/httpErrors.js';
import type { ErrorDetail } from '../../../../shared/types/response.js';
import { sanitizeRichText } from '../../common/html.js';
import { isRecordNotFound } from '../../common/prismaErrors.js';
import type { FaqContent, FaqDetail } from '../../faqs/faq.schema.js';
import { toFaqDetail } from '../../faqs/faq.service.js';
import {
  createFaqRecord,
  deleteFaqRecord,
  findFaqById,
  updateFaqRecord,
} from './faq.repository.js';
import type { CreateFaqPayload, PatchFaqPayload } from './faq.schema.js';

type FaqLocale = { question: string; answer: string };

function sanitizeLocaleContent(locale: FaqLocale): FaqLocale {
  return {
    question: locale.question,
    answer: sanitizeRichText(locale.answer),
  };
}

function validateLocaleCompleteness(content: FaqContent): ErrorDetail[] {
  const issues: ErrorDetail[] = [];
  for (const locale of ['en', 'de'] as const) {
    const localeContent = content[locale];
    if (
      localeContent === undefined ||
      localeContent.question.trim().length === 0
    ) {
      issues.push({
        path: `${locale}.question`,
        message: 'Question is required',
      });
    }
    if (
      localeContent === undefined ||
      localeContent.answer.trim().length === 0
    ) {
      issues.push({
        path: `${locale}.answer`,
        message: 'Answer is required',
      });
    }
  }
  return issues;
}

export async function getAdminFaq(id: string): Promise<FaqDetail> {
  const faq = await findFaqById(id);
  if (faq === null) {
    throw new NotFoundError('FAQ not found');
  }
  return toFaqDetail(faq);
}

export async function createFaq(payload: CreateFaqPayload): Promise<FaqDetail> {
  const faq = await createFaqRecord({
    content: {
      en: sanitizeLocaleContent(payload.en),
      de: sanitizeLocaleContent(payload.de),
    },
    displayOrder: payload.displayOrder,
  });
  return toFaqDetail(faq);
}

export async function updateFaq(
  id: string,
  payload: PatchFaqPayload,
): Promise<FaqDetail> {
  const existing = await findFaqById(id);
  if (existing === null) {
    throw new NotFoundError('FAQ not found');
  }

  const data: {
    content?: Prisma.InputJsonValue;
    displayOrder?: number;
    isActive?: boolean;
  } = {};

  const nextContent: FaqContent = {
    ...(existing.content as FaqContent),
  };
  if (payload.en !== undefined) {
    nextContent.en = sanitizeLocaleContent(payload.en);
  }
  if (payload.de !== undefined) {
    nextContent.de = sanitizeLocaleContent(payload.de);
  }
  if (payload.en !== undefined || payload.de !== undefined) {
    data.content = nextContent;
  }
  if (payload.displayOrder !== undefined) {
    data.displayOrder = payload.displayOrder;
  }
  if (payload.isActive !== undefined) {
    data.isActive = payload.isActive;
  }

  if (data.isActive === true) {
    const contentToValidate: FaqContent =
      data.content === undefined
        ? (existing.content as FaqContent)
        : nextContent;
    const issues = validateLocaleCompleteness(contentToValidate);
    if (issues.length > 0) {
      throw new ValidationError('Activation validation failed', issues);
    }
  }

  try {
    const faq = await updateFaqRecord(id, data);
    return toFaqDetail(faq);
  } catch (err) {
    if (isRecordNotFound(err)) {
      throw new NotFoundError('FAQ not found');
    }
    throw err;
  }
}

export async function deleteFaq(id: string): Promise<void> {
  const existing = await findFaqById(id);
  if (existing === null) {
    throw new NotFoundError('FAQ not found');
  }

  try {
    await deleteFaqRecord(id);
  } catch (err) {
    if (isRecordNotFound(err)) {
      throw new NotFoundError('FAQ not found');
    }
    throw err;
  }
}
