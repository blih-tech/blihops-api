import express from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './shared/auth/auth.js';
import { authRouter } from './features/auth/index.js';
import { corsMiddleware } from './shared/middlewares/cors.js';
import { openapiRouter } from './shared/middlewares/openapi.js';
import { requestLogger } from './shared/middlewares/requestLogger.js';
import { errorHandler } from './shared/middlewares/errorHandler.js';
import { notFoundHandler } from './shared/middlewares/notFoundHandler.js';
import { securityHeaders } from './shared/middlewares/securityHeaders.js';
import { sendSuccess } from './shared/utils/response.js';
import { env } from './shared/configs/env.js';

const app = express();

app.use(requestLogger);
app.use(securityHeaders);
app.use(corsMiddleware);

if (env.NODE_ENV !== 'production') {
  app.use('/api/v1', openapiRouter);
}

app.use('/api/v1/auth', authRouter);

app.all('/api/v1/auth/*splat', toNodeHandler(auth));

app.use(express.json());

app.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'ok' });
});

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
