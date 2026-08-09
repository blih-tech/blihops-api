import type { PilotFaq } from '../../../generated/prisma/client.js';
import type { FaqContent, FaqDetail } from './faq.schema.js';
import { findAllFaqs, findActiveFaqs } from './faq.repository.js';

function toFaqDetail(faq: PilotFaq): FaqDetail {
  return {
    id: faq.id,
    isActive: faq.isActive,
    displayOrder: faq.displayOrder,
    content: faq.content as FaqContent,
  };
}

export { toFaqDetail };

export async function listPublicFaqs(): Promise<FaqDetail[]> {
  const faqs = await findActiveFaqs();
  return faqs.map(toFaqDetail);
}

export async function listAllFaqs(): Promise<FaqDetail[]> {
  const faqs = await findAllFaqs();
  return faqs.map(toFaqDetail);
}
