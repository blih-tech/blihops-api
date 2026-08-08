import { Router } from 'express';

import { listTestimonialsController } from './testimonial.controller.js';

export const testimonialRouter = Router();

testimonialRouter.get('/', listTestimonialsController);
