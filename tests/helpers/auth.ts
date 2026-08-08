import { randomUUID } from 'node:crypto';

import { hashPassword } from 'better-auth/crypto';
import request from 'supertest';

import { app } from '../../src/app.js';
import { prisma } from '../../src/shared/db/prisma.js';

export type TestRole = 'admin' | 'client' | 'talent';

const TEST_PASSWORD = 'TestPass123!';

export async function createTestUser(role: TestRole) {
  const email = `user-${randomUUID()}@blihops.test`;
  const passwordHash = await hashPassword(TEST_PASSWORD);
  const userId = randomUUID();

  await prisma.$transaction([
    prisma.user.create({
      data: {
        id: userId,
        name: 'Test User',
        email,
        emailVerified: true,
        role,
      },
    }),
    prisma.account.create({
      data: {
        id: randomUUID(),
        userId,
        accountId: userId,
        providerId: 'credential',
        password: passwordHash,
      },
    }),
  ]);

  return { email, password: TEST_PASSWORD, userId };
}

export async function signIn(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/sign-in/email')
    .send({ email, password })
    .expect(200);

  const setCookie = res.headers['set-cookie'] as unknown as
    string[] | undefined;
  const sessionCookie = (setCookie ?? []).find((cookie) =>
    cookie.startsWith('better-auth.session_token='),
  );
  if (sessionCookie === undefined) {
    throw new Error('Sign-in did not set a session cookie');
  }

  return sessionCookie.split(';')[0] ?? '';
}

export async function createAdminSession(): Promise<{
  cookie: string;
  email: string;
}> {
  const { email, password } = await createTestUser('admin');
  const cookie = await signIn(email, password);
  return { cookie, email };
}

export async function createClientSession(): Promise<string> {
  const { email, password } = await createTestUser('client');
  return signIn(email, password);
}
