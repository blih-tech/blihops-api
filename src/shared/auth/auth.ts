import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bearer, openAPI } from 'better-auth/plugins';

import { prisma } from '../db/prisma.js';
import { env } from '../configs/env.js';
import { logger } from '../configs/logger.js';
import type { AuthRole } from '../middlewares/auth.js';
import {
  createEmailClient,
  inviteTemplate,
  isResetUrlAllowed,
  resetPasswordTemplate,
} from '../email/index.js';

const emailClient = createEmailClient();

export const auth = betterAuth({
  basePath: '/api/v1/auth',
  baseURL: env.API_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  user: {
    additionalFields: {
      role: {
        type: ['admin', 'client', 'talent'],
        required: true,
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    // eslint-disable-next-line @typescript-eslint/require-await -- fire-and-forget per Better Auth guidance
    sendResetPassword: async ({ user, url }, request) => {
      if (!isResetUrlAllowed(url, env.CORS_ORIGIN, env.API_URL)) {
        logger.warn(
          { to: user.email, url },
          'blocked reset email with disallowed origin',
        );
        return;
      }
      const isInvite = request?.headers.get('x-invite-flow') === '1';
      const role = (user as unknown as { role: AuthRole }).role;
      const template = isInvite
        ? inviteTemplate(env.EMAIL_LOGO_URL, url, user.name, role)
        : resetPasswordTemplate(env.EMAIL_LOGO_URL, url);
      void emailClient
        .send({ to: user.email, ...template })
        .catch((err) =>
          logger.warn(
            { err, to: user.email },
            `${isInvite ? 'invite' : 'reset'} email send failed`,
          ),
        );
    },
  },
  rateLimit: {
    enabled: true,
  },
  trustedOrigins: env.CORS_ORIGIN,
  plugins: [openAPI({ disableDefaultReference: true }), bearer()],
});
