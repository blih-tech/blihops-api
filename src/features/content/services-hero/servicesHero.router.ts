import { Router } from 'express';

import { getServicesHeroController } from './servicesHero.controller.js';

export const servicesHeroRouter = Router();

servicesHeroRouter.get('/', getServicesHeroController);
