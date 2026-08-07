import 'dotenv/config';

import { randomUUID } from 'node:crypto';

import { hashPassword } from 'better-auth/crypto';

import { prisma } from '../db/prisma.js';
import { logger } from '../configs/logger.js';

const SEED_ADMIN_EMAIL = 'yonatanemekete44@gmail.com';
const SEED_ADMIN_NAME = 'Yonatane';
const SEED_ADMIN_ROLE = 'admin';

async function seedAdmin() {
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (password === undefined || password.length === 0) {
    logger.error(
      'SEED_ADMIN_PASSWORD is not set. Add it to .env before running this script.',
    );
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({
    where: { email: SEED_ADMIN_EMAIL },
  });
  if (existing !== null) {
    logger.info({ email: SEED_ADMIN_EMAIL }, 'admin already exists, skipping');
    return;
  }

  const userId = randomUUID();
  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.create({
      data: {
        id: userId,
        name: SEED_ADMIN_NAME,
        email: SEED_ADMIN_EMAIL,
        emailVerified: true,
        role: SEED_ADMIN_ROLE,
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
    { email: SEED_ADMIN_EMAIL, role: SEED_ADMIN_ROLE },
    'admin seeded successfully',
  );
}

seedAdmin()
  .catch((err) => {
    logger.error({ err }, 'admin seed failed');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
