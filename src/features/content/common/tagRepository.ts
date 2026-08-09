import { NotFoundError } from '../../../shared/errors/httpErrors.js';
import { prisma } from '../../../shared/db/prisma.js';

export async function validateTagsExist(tagIds: string[]): Promise<void> {
  if (tagIds.length === 0) return;

  const tags = await prisma.tag.findMany({
    where: { id: { in: tagIds } },
    select: { id: true },
  });
  if (tags.length !== tagIds.length) {
    throw new NotFoundError('One or more tags were not found');
  }
}
