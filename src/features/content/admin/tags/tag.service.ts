import { Prisma } from '../../../../generated/prisma/client.js';
import {
  ConflictError,
  NotFoundError,
} from '../../../../shared/errors/httpErrors.js';
import type { TagResponse } from '../../tags/tag.schema.js';
import { toTagResponse } from '../../tags/tag.service.js';
import {
  createTagRecord,
  deleteTagRecord,
  findTagById,
  findTagByName,
  updateTagRecord,
} from './tag.repository.js';

const isUniqueViolation = (err: unknown): boolean =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';

export async function createTag(payload: {
  name: string;
}): Promise<TagResponse> {
  const existing = await findTagByName(payload.name);
  if (existing !== null) {
    throw new ConflictError('A tag with this name already exists');
  }

  try {
    const tag = await createTagRecord(payload);
    return toTagResponse(tag);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ConflictError('A tag with this name already exists');
    }
    throw err;
  }
}

export async function updateTag(
  id: string,
  payload: { name: string },
): Promise<TagResponse> {
  const existingTag = await findTagById(id);
  if (existingTag === null) {
    throw new NotFoundError('Tag not found');
  }

  const nameTaken = await findTagByName(payload.name);
  if (nameTaken !== null && nameTaken.id !== id) {
    throw new ConflictError('A tag with this name already exists');
  }

  try {
    const tag = await updateTagRecord(id, payload.name);
    return toTagResponse(tag);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ConflictError('A tag with this name already exists');
    }
    throw err;
  }
}

export async function deleteTag(id: string): Promise<void> {
  const existingTag = await findTagById(id);
  if (existingTag === null) {
    throw new NotFoundError('Tag not found');
  }

  await deleteTagRecord(id);
}
