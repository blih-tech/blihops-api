import { Router } from 'express';

import { listLogosController } from './logo.controller.js';

export const logoRouter = Router();

logoRouter.get('/', listLogosController);
