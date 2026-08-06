import { pino } from 'pino';
import type { LevelWithSilent } from 'pino';
import { env } from './env.js';

const isProduction = env.NODE_ENV === 'production';
const isTest = env.NODE_ENV === 'test';

const level: LevelWithSilent = isTest ? 'silent' : env.LOG_LEVEL;

export const logger = pino({
  level,
  redact: ['req.headers.authorization', 'req.headers.cookie'],
  ...(isProduction || isTest
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
          },
        },
      }),
});
