import rateLimit from 'express-rate-limit';

import { TooManyRequestsError } from '../errors/httpErrors.js';

/** 20 requests / 10 minutes / IP — public lead form endpoints only. */
export const formRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('Too many requests, please try again later'));
  },
});
