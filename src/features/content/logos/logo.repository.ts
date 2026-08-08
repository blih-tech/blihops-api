import { prisma } from '../../../shared/db/prisma.js';

export function findAllLogos() {
  return prisma.trustedLogo.findMany({
    orderBy: { createdAt: 'asc' },
  });
}
