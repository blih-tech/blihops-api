import 'dotenv/config';
import { app } from './app.js';
import { env } from './shared/configs/env.js';
import { logger } from './shared/configs/logger.js';

const port = env.PORT;

const server = app.listen(port, () => {
  logger.info({ port, nodeEnv: env.NODE_ENV }, 'blihops-api started');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaught exception');
  logger.flush(() => process.exit(1));
  setTimeout(() => process.exit(1), 2_000).unref();
});

process.on('unhandledRejection', (reason) => {
  logger.error(
    {
      err: reason instanceof Error ? reason : new Error(String(reason)),
    },
    'unhandled rejection',
  );
  logger.flush(() => process.exit(1));
  setTimeout(() => process.exit(1), 2_000).unref();
});

const shutdown = (signal: NodeJS.Signals) => {
  logger.info({ signal }, 'shutting down');
  server.close(() => {
    logger.flush(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => shutdown(signal));
}
