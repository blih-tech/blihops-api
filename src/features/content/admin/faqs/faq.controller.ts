import type { Request, Response } from 'express';
import { z } from 'zod';

import { sendMany, sendSuccess } from '../../../../shared/utils/response.js';
import { listAllFaqs } from '../../faqs/faq.service.js';
import { createFaqBodySchema, patchFaqBodySchema } from './faq.schema.js';
import { createFaq, deleteFaq, getAdminFaq, updateFaq } from './faq.service.js';

export async function getAdminFaqsController(_req: Request, res: Response) {
  const faqs = await listAllFaqs();
  sendMany(res, faqs, {});
}

export async function getAdminFaqController(
  req: Request<{ id: string }>,
  res: Response,
) {
  const faq = await getAdminFaq(req.params.id);
  sendSuccess(res, faq);
}

export async function createFaqController(
  req: Request<
    Record<string, string>,
    unknown,
    z.infer<typeof createFaqBodySchema>
  >,
  res: Response,
) {
  const faq = await createFaq(req.body);
  sendSuccess(res, faq, 201);
}

export async function updateFaqController(
  req: Request<{ id: string }, unknown, z.infer<typeof patchFaqBodySchema>>,
  res: Response,
) {
  const faq = await updateFaq(req.params.id, req.body);
  sendSuccess(res, faq);
}

export async function deleteFaqController(
  req: Request<{ id: string }>,
  res: Response,
) {
  await deleteFaq(req.params.id);
  res.status(204).end();
}
