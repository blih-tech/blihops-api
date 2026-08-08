import { Router } from 'express';

import { listTagsController } from './tag.controller.js';

export const tagRouter = Router();

tagRouter.get('/', listTagsController);
