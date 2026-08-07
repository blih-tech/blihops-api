import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

import { prisma } from '../db/prisma.js';
import { env } from '../configs/env.js';
import { logger } from '../configs/logger.js';
import {
  createEmailClient,
  isResetUrlAllowed,
  resetPasswordTemplate,
} from '../email/index.js';

const emailClient = createEmailClient();

export const auth = betterAuth({
  baseURL: env.API_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    // eslint-disable-next-line @typescript-eslint/require-await -- fire-and-forget per Better Auth guidance
    sendResetPassword: async ({ user, url }) => {
      if (!isResetUrlAllowed(url, env.CORS_ORIGIN, env.API_URL)) {
        logger.warn(
          { to: user.email, url },
          'blocked reset email with disallowed origin',
        );
        return;
      }
      void emailClient
        .send({ to: user.email, ...resetPasswordTemplate(url) })
        .catch((err) =>
          logger.warn({ err, to: user.email }, 'reset email send failed'),
        );
    },
  },
  rateLimit: {
    enabled: true,
  },
  trustedOrigins: env.CORS_ORIGIN,
});
