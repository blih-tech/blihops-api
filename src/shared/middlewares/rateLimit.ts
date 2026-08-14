import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';

import { env } from '../configs/env.js';
import { TooManyRequestsError } from '../errors/httpErrors.js';

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('Too many requests, please try again later'));
  },
});

/**
 * Public lead form endpoints: 20 requests / 10 minutes / IP.
 * Bypassed in the test environment — integration suites issue many POSTs
 * from a single IP and would trip the limiter mid-suite.
 */
export const formRateLimiter: RequestHandler =
  env.NODE_ENV === 'test'
    ? (_req, _res, next) => next()
    : (limiter as RequestHandler);
