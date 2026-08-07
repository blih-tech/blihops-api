import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    API_URL: z.string().url(),
    WEB_URL: z.string().url(),
    LOG_LEVEL: z
      .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
      .default('info'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, 'BETTER_AUTH_SECRET must be at least 32 characters long'),
    CORS_ORIGIN: z
      .string()
      .min(1, 'CORS_ORIGIN is required')
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter((origin) => origin.length > 0),
      )
      .pipe(z.array(z.url())),
    RESEND_API_KEY: z.string().trim().optional(),
    EMAIL_FROM: z
      .string()
      .trim()
      .default('Blih Ops <noreply@mail.blihops.com>'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'test' && !env.RESEND_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['RESEND_API_KEY'],
        message: 'RESEND_API_KEY is required outside of the test environment',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;
