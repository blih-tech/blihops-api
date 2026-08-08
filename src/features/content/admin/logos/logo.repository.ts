import { prisma } from '../../../../shared/db/prisma.js';

export function createLogoRecord(data: { imageUrl: string; alt: string }) {
  return prisma.trustedLogo.create({ data });
}

export function findLogoById(id: string) {
  return prisma.trustedLogo.findUnique({ where: { id } });
}

export function updateLogoRecord(
  id: string,
  data: { imageUrl: string; alt: string },
) {
  return prisma.trustedLogo.update({ where: { id }, data });
}

export function deleteLogoRecord(id: string) {
  return prisma.trustedLogo.delete({ where: { id } });
}
