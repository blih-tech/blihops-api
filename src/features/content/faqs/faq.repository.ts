import { prisma } from '../../../shared/db/prisma.js';

export function findActiveFaqs() {
  return prisma.pilotFaq.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
  });
}

export function findAllFaqs() {
  return prisma.pilotFaq.findMany({
    orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
  });
}
