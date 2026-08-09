import { randomUUID } from 'node:crypto';

import { prisma } from '../../shared/db/prisma.js';

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function createUserWithCredentialAccount(data: {
  id: string;
  name: string;
  email: string;
  role: string;
  passwordHash: string;
}) {
  return prisma.$transaction([
    prisma.user.create({
      data: {
        id: data.id,
        name: data.name,
        email: data.email,
        emailVerified: true,
        role: data.role,
      },
    }),
    prisma.account.create({
      data: {
        id: randomUUID(),
        userId: data.id,
        accountId: data.id,
        providerId: 'credential',
        password: data.passwordHash,
      },
    }),
  ]);
}
