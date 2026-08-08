import { Router } from 'express';

import { listCategoriesController } from './category.controller.js';

export const categoryRouter = Router();

categoryRouter.get('/', listCategoriesController);
