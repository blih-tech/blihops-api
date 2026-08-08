import type { Request, Response } from 'express';

import { setPublicCache } from '../common/cache.js';
import { sendMany } from '../../../shared/utils/response.js';
import { listTestimonials } from './testimonial.service.js';

export async function listTestimonialsController(_req: Request, res: Response) {
  const testimonials = await listTestimonials();
  setPublicCache(res);
  sendMany(res, testimonials, {});
}
