import type { Request, Response } from 'express';

import {
  type BodyAndParamsOf,
  type BodyOf,
  type ParamsOf,
} from '../../../../shared/middlewares/validate.js';
import { sendMany, sendSuccess } from '../../../../shared/utils/response.js';
import { listAllFaqs } from '../../faqs/faq.service.js';
import {
  createFaqBodySchema,
  faqIdParamsSchema,
  patchFaqBodySchema,
} from './faq.schema.js';
import { createFaq, deleteFaq, getAdminFaq, updateFaq } from './faq.service.js';

export async function getAdminFaqsController(_req: Request, res: Response) {
  const faqs = await listAllFaqs();
  sendMany(res, faqs, {});
}

export async function getAdminFaqController(
  req: ParamsOf<typeof faqIdParamsSchema>,
  res: Response,
) {
  const faq = await getAdminFaq(req.params.id);
  sendSuccess(res, faq);
}

export async function createFaqController(
  req: BodyOf<typeof createFaqBodySchema>,
  res: Response,
) {
  const faq = await createFaq(req.body);
  sendSuccess(res, faq, 201);
}

export async function updateFaqController(
  req: BodyAndParamsOf<typeof patchFaqBodySchema, typeof faqIdParamsSchema>,
  res: Response,
) {
  const faq = await updateFaq(req.params.id, req.body);
  sendSuccess(res, faq);
}

export async function deleteFaqController(
  req: ParamsOf<typeof faqIdParamsSchema>,
  res: Response,
) {
  await deleteFaq(req.params.id);
  res.status(204).end();
}
