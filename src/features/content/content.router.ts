import { Router } from 'express';

import { adminContentRouter } from './admin/admin.router.js';
import { categoryRouter } from './categories/index.js';
import { logoRouter } from './logos/index.js';
import { tagRouter } from './tags/index.js';

export const contentRouter = Router();

contentRouter.use('/tags', tagRouter);
contentRouter.use('/categories', categoryRouter);
contentRouter.use('/logos', logoRouter);
contentRouter.use('/admin', adminContentRouter);
