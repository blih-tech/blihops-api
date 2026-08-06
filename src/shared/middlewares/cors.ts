import cors from 'cors';
import { env } from '../configs/env.js';

export const corsMiddleware = cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  exposedHeaders: ['X-Request-Id'],
  maxAge: 86_400,
});
