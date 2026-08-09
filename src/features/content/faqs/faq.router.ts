import { Router } from 'express';

import { listFaqsController } from './faq.controller.js';

export const faqRouter = Router();

faqRouter.get('/', listFaqsController);
