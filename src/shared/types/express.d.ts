import type { RequestAuth } from '../middlewares/auth.js';

declare global {
  namespace Express {
    interface Request {
      auth?: RequestAuth;
    }
  }
}

export {};
