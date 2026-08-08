import { prisma } from '../../../../shared/db/prisma.js';

export function createCategoryRecord(data: { name: string }) {
  return prisma.category.create({ data });
}

export function findCategoryById(id: string) {
  return prisma.category.findUnique({ where: { id } });
}

export function findCategoryByName(name: string) {
  return prisma.category.findUnique({ where: { name } });
}

export function updateCategoryRecord(id: string, name: string) {
  return prisma.category.update({ where: { id }, data: { name } });
}

export function deleteCategoryRecord(id: string) {
  return prisma.category.delete({ where: { id } });
}
