import 'dotenv/config';

import { randomUUID } from 'node:crypto';

import { hashPassword } from 'better-auth/crypto';

import { prisma } from '../db/prisma.js';
import { logger } from '../configs/logger.js';

const DEMO_USERS = [
  {
    email: 'client@blihops.com',
    name: 'Client User',
    role: 'client' as const,
  },
  {
    email: 'talent@blihops.com',
    name: 'Talent User',
    role: 'talent' as const,
  },
];

async function seedDemoUsers() {
  const password = process.env.SEED_DEMO_PASSWORD;
  if (password === undefined || password.length === 0) {
    logger.error(
      'SEED_DEMO_PASSWORD is not set. Add it to .env before running this script.',
    );
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  for (const demo of DEMO_USERS) {
    const existing = await prisma.user.findUnique({
      where: { email: demo.email },
    });
    if (existing !== null) {
      logger.info({ email: demo.email }, 'demo user already exists, skipping');
      continue;
    }

    const userId = randomUUID();

    await prisma.$transaction([
      prisma.user.create({
        data: {
          id: userId,
          name: demo.name,
          email: demo.email,
          emailVerified: true,
          role: demo.role,
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

    logger.info(
      { email: demo.email, role: demo.role },
      'demo user seeded successfully',
    );
  }
}

seedDemoUsers()
  .catch((err) => {
    logger.error({ err }, 'demo users seed failed');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
