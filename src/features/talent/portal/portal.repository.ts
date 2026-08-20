import { prisma } from '../../../shared/db/prisma.js';

export function findTalentAccountByUserId(userId: string) {
  return prisma.talentAccount.findUnique({
    where: { userId },
    include: { talentProfile: true, user: true },
  });
}
