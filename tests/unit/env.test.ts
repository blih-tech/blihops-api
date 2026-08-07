import { describe, expect, it } from 'vitest';
import { envSchema } from '../../src/shared/configs/envSchema.js';

const without = (obj: Record<string, unknown>, ...keys: string[]) => {
  const copy = { ...obj };
  for (const key of keys) {
    delete copy[key];
  }
  return copy;
};

const validEnv = {
  NODE_ENV: 'development',
  PORT: '4000',
  API_URL: 'http://localhost:4000',
  WEB_URL: 'http://localhost:3000',
  LOG_LEVEL: 'debug',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/blihops',
  BETTER_AUTH_SECRET: 'replace-with-another-32-random-characters',
  CORS_ORIGIN: 'http://localhost:3000',
  RESEND_API_KEY: 're_test_placeholder',
};

describe('env validation', () => {
  it('passes with a valid env', () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
  });

  it('fails when BETTER_AUTH_SECRET is missing', () => {
    const result = envSchema.safeParse(without(validEnv, 'BETTER_AUTH_SECRET'));
    expect(result.success).toBe(false);
  });

  it('fails when BETTER_AUTH_SECRET is too short', () => {
    const result = envSchema.safeParse({
      ...validEnv,
      BETTER_AUTH_SECRET: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('fails when RESEND_API_KEY is missing outside of test', () => {
    const result = envSchema.safeParse(without(validEnv, 'RESEND_API_KEY'));
    expect(result.success).toBe(false);
  });

  it('allows RESEND_API_KEY to be missing in test env', () => {
    const result = envSchema.safeParse({
      ...without(validEnv, 'RESEND_API_KEY'),
      NODE_ENV: 'test',
    });
    expect(result.success).toBe(true);
  });

  it('fails when DATABASE_URL is missing', () => {
    const result = envSchema.safeParse(without(validEnv, 'DATABASE_URL'));
    expect(result.success).toBe(false);
  });

  it('fails when API_URL is missing', () => {
    const result = envSchema.safeParse(without(validEnv, 'API_URL'));
    expect(result.success).toBe(false);
  });

  it('fails when API_URL is not a valid URL', () => {
    const result = envSchema.safeParse({ ...validEnv, API_URL: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('fails when CORS_ORIGIN is missing', () => {
    const result = envSchema.safeParse(without(validEnv, 'CORS_ORIGIN'));
    expect(result.success).toBe(false);
  });

  it('fails with an invalid NODE_ENV', () => {
    const result = envSchema.safeParse({ ...validEnv, NODE_ENV: 'staging' });
    expect(result.success).toBe(false);
  });

  it('fails when PORT is not a positive integer', () => {
    const zero = envSchema.safeParse({ ...validEnv, PORT: '0' });
    const negative = envSchema.safeParse({ ...validEnv, PORT: '-1' });
    const nonNumeric = envSchema.safeParse({ ...validEnv, PORT: 'abc' });
    expect(zero.success).toBe(false);
    expect(negative.success).toBe(false);
    expect(nonNumeric.success).toBe(false);
  });

  it('applies defaults for optional values', () => {
    const result = envSchema.safeParse(
      without(validEnv, 'NODE_ENV', 'PORT', 'LOG_LEVEL'),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.NODE_ENV).toBe('development');
      expect(result.data.PORT).toBe(4000);
      expect(result.data.LOG_LEVEL).toBe('info');
    }
  });

  it('parses comma-separated CORS origins into an array', () => {
    const result = envSchema.safeParse({
      ...validEnv,
      CORS_ORIGIN: 'http://localhost:3000, http://localhost:5173',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.CORS_ORIGIN).toEqual([
        'http://localhost:3000',
        'http://localhost:5173',
      ]);
    }
  });

  it('fails when a CORS origin is not a valid URL', () => {
    const result = envSchema.safeParse({
      ...validEnv,
      CORS_ORIGIN: 'http://localhost:3000,not-a-url',
    });
    expect(result.success).toBe(false);
  });
});
