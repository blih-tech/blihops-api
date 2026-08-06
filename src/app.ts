import express from 'express';
import { corsMiddleware } from './shared/middlewares/cors.js';
import { requestLogger } from './shared/middlewares/requestLogger.js';
import { errorHandler } from './shared/middlewares/errorHandler.js';
import { notFoundHandler } from './shared/middlewares/notFoundHandler.js';
import { securityHeaders } from './shared/middlewares/securityHeaders.js';
import { sendSuccess } from './shared/utils/response.js';

const app = express();

app.use(requestLogger);
app.use(securityHeaders);
app.use(corsMiddleware);

app.use(express.json());

app.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'ok' });
});

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
