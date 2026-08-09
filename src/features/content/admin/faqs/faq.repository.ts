import { Prisma } from '../../../../generated/prisma/client.js';
import { prisma } from '../../../../shared/db/prisma.js';

export function findFaqById(id: string) {
  return prisma.pilotFaq.findUnique({ where: { id } });
}

export function createFaqRecord(data: {
  content: Prisma.InputJsonValue;
  displayOrder: number;
}) {
  return prisma.pilotFaq.create({ data });
}

export function updateFaqRecord(
  id: string,
  data: {
    content?: Prisma.InputJsonValue;
    displayOrder?: number;
    isActive?: boolean;
  },
) {
  return prisma.pilotFaq.update({ where: { id }, data });
}

export function deleteFaqRecord(id: string) {
  return prisma.pilotFaq.delete({ where: { id } });
}
