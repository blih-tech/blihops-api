import type { Request, Response } from 'express';

import {
  type BodyAndParamsOf,
  type BodyOf,
  type ParamsOf,
} from '../../../../shared/middlewares/validate.js';
import { sendMany, sendSuccess } from '../../../../shared/utils/response.js';
import { listTestimonials } from '../../testimonials/testimonial.service.js';
import {
  createTestimonialBodySchema,
  deleteTestimonialParamsSchema,
  updateTestimonialBodySchema,
  updateTestimonialParamsSchema,
} from './testimonial.schema.js';
import {
  createTestimonial,
  deleteTestimonial,
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
  req: BodyOf<typeof createTestimonialBodySchema>,
  res: Response,
) {
  const testimonial = await createTestimonial(req.body);
  sendSuccess(res, testimonial, 201);
}

export async function updateTestimonialController(
  req: BodyAndParamsOf<
    typeof updateTestimonialBodySchema,
    typeof updateTestimonialParamsSchema
  >,
  res: Response,
) {
  const testimonial = await updateTestimonial(req.params.id, req.body);
  sendSuccess(res, testimonial);
}

export async function deleteTestimonialController(
  req: ParamsOf<typeof deleteTestimonialParamsSchema>,
  res: Response,
) {
  await deleteTestimonial(req.params.id);
  res.status(204).end();
}
