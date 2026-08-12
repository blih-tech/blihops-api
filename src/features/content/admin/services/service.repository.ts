import { Prisma } from '../../../../generated/prisma/client.js';
import { prisma } from '../../../../shared/db/prisma.js';

export function findServiceById(id: string) {
  return prisma.service.findUnique({ where: { id } });
}

export function findServiceBySlug(slug: string, excludeId?: string) {
  return prisma.service.findFirst({
    where: {
      OR: [
        { content: { path: ['en', 'slug'], equals: slug } },
        { content: { path: ['de', 'slug'], equals: slug } },
      ],
      ...(excludeId !== undefined ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });
}

export async function maxServiceDisplayOrder(): Promise<number> {
  const result = await prisma.service.aggregate({
    _max: { displayOrder: true },
  });
  return result._max.displayOrder ?? -1;
}

export function createServiceRecord(data: {
  icon: string;
  imageUrl: string;
  alt: string;
  displayOrder: number;
  content: Prisma.InputJsonValue;
}) {
  return prisma.service.create({ data });
}

export function updateServiceRecord(
  id: string,
  data: {
    icon?: string;
    imageUrl?: string;
    alt?: string;
    displayOrder?: number;
    content?: Prisma.InputJsonValue;
  },
) {
  return prisma.service.update({ where: { id }, data });
}

export function deleteServiceRecord(id: string) {
  return prisma.service.delete({ where: { id } });
}
