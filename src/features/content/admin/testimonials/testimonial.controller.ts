import type { Request, Response } from 'express';

import { sendMany, sendSuccess } from '../../../../shared/utils/response.js';
import { listTestimonials } from '../../testimonials/testimonial.service.js';
import {
  createTestimonial,
  deleteTestimonial,
  type CreateTestimonialPayload,
  type UpdateTestimonialPayload,
  updateTestimonial,
} from './testimonial.service.js';

export async function getAdminTestimonialsController(
  _req: Request,
  res: Response,
) {
  const testimonials = await listTestimonials();
  sendMany(res, testimonials, {});
}

export async function createTestimonialController(
  req: Request<Record<string, string>, unknown, CreateTestimonialPayload>,
  res: Response,
) {
  const testimonial = await createTestimonial(req.body);
  sendSuccess(res, testimonial, 201);
}

export async function updateTestimonialController(
  req: Request<{ id: string }, unknown, UpdateTestimonialPayload>,
  res: Response,
) {
  const testimonial = await updateTestimonial(req.params.id, req.body);
  sendSuccess(res, testimonial);
}

export async function deleteTestimonialController(
  req: Request<{ id: string }>,
  res: Response,
) {
  await deleteTestimonial(req.params.id);
  res.status(204).end();
}
