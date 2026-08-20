import express, { type Request } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './shared/auth/auth.js';
import { authRouter } from './features/auth/index.js';
import { contentRouter } from './features/content/index.js';
import { leadsRouter } from './features/leads/index.js';
import { talentRouter } from './features/talent/talent.router.js';
import { corsMiddleware } from './shared/middlewares/cors.js';
import { openapiRouter } from './shared/middlewares/openapi.js';
import { requestLogger } from './shared/middlewares/requestLogger.js';
import { errorHandler } from './shared/middlewares/errorHandler.js';
import { notFoundHandler } from './shared/middlewares/notFoundHandler.js';
import { securityHeaders } from './shared/middlewares/securityHeaders.js';
import { sendSuccess } from './shared/utils/response.js';
import { env } from './shared/configs/env.js';

const app = express();

// Render sits behind a proxy: trust the first hop so req.ip is the real
// client IP (required for correct IP-based rate limiting; express-rate-limit
// also rejects requests when X-Forwarded-For is present without this).
app.set('trust proxy', 1);

app.use(requestLogger);
app.use(securityHeaders);
app.use(corsMiddleware);

if (env.NODE_ENV !== 'production') {
  app.use('/api/v1', openapiRouter);
}

app.use('/api/v1/auth', authRouter);

app.all('/api/v1/auth/*splat', toNodeHandler(auth));

app.use(
  express.json({
    // Keep the raw body for webhook signature verification (HMAC over bytes).
    verify: (req: Request, _res, buf) => {
      (req as Request & { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);

app.use('/api/v1/content', contentRouter);

app.use('/api/v1/leads', leadsRouter);

app.use('/api/v1', talentRouter);

app.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'ok' });
});

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
