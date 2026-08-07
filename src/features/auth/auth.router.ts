import { Router, json } from 'express';

import { requireAuth, requireRole } from '../../shared/middlewares/auth.js';
import {
  acceptInviteController,
  inviteUserController,
} from './auth.controller.js';

export const authRouter = Router();

authRouter.post(
  '/invite',
  json(),
  requireAuth,
  requireRole('admin'),
  inviteUserController,
);
authRouter.post('/accept-invite', json(), acceptInviteController);
