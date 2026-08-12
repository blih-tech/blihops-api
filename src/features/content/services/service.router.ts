import { Router } from 'express';

import { listServicesController } from './service.controller.js';

export const serviceRouter = Router();

serviceRouter.get('/', listServicesController);
