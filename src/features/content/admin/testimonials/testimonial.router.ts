import { Router } from 'express';

import { validate } from '../../../../shared/middlewares/validate.js';
import {
  createTestimonialBodySchema,
  deleteTestimonialParamsSchema,
  updateTestimonialBodySchema,
  updateTestimonialParamsSchema,
} from './testimonial.schema.js';
import {
  createTestimonialController,
  deleteTestimonialController,
  getAdminTestimonialsController,
  updateTestimonialController,
} from './testimonial.controller.js';

export const adminTestimonialRouter = Router();

adminTestimonialRouter.get('/', getAdminTestimonialsController);

adminTestimonialRouter.post(
  '/',
  validate('body', createTestimonialBodySchema),
  createTestimonialController,
);

adminTestimonialRouter.patch(
  '/:id',
  validate('params', updateTestimonialParamsSchema),
  validate('body', updateTestimonialBodySchema),
  updateTestimonialController,
);

adminTestimonialRouter.delete(
  '/:id',
  validate('params', deleteTestimonialParamsSchema),
  deleteTestimonialController,
);
