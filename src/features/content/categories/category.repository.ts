import { prisma } from '../../../shared/db/prisma.js';

export async function findAllCategories() {
  const categories = await prisma.category.findMany();
  return categories.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );
}
