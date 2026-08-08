import { prisma } from '../../../shared/db/prisma.js';

export async function findAllTags() {
  const tags = await prisma.tag.findMany();
  return tags.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );
}
