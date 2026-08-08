import { prisma } from '../../../../shared/db/prisma.js';

export function createTagRecord(data: { name: string }) {
  return prisma.tag.create({ data });
}

export function findTagById(id: string) {
  return prisma.tag.findUnique({ where: { id } });
}

export function findTagByName(name: string) {
  return prisma.tag.findUnique({ where: { name } });
}

export function updateTagRecord(id: string, name: string) {
  return prisma.tag.update({ where: { id }, data: { name } });
}

export function deleteTagRecord(id: string) {
  return prisma.tag.delete({ where: { id } });
}
