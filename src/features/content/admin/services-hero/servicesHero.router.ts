import { Router } from 'express';

import { validate } from '../../../../shared/middlewares/validate.js';
import { putServicesHeroBodySchema } from './servicesHero.schema.js';
import {
  getAdminServicesHeroController,
  putServicesHeroController,
} from './servicesHero.controller.js';

export const adminServicesHeroRouter = Router();

adminServicesHeroRouter.get('/', getAdminServicesHeroController);

adminServicesHeroRouter.put(
  '/',
  validate('body', putServicesHeroBodySchema),
  putServicesHeroController,
);
