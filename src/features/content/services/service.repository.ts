import { prisma } from '../../../shared/db/prisma.js';

export function findServices() {
  return prisma.service.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
  });
}
