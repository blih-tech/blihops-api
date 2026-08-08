import type { Tag } from '../../../generated/prisma/client.js';
import type { TagResponse } from './tag.schema.js';
import { findAllTags } from './tag.repository.js';

function toTagResponse(tag: Tag): TagResponse {
  return {
    id: tag.id,
    name: tag.name,
  };
}

export { toTagResponse };

export async function listTags(): Promise<TagResponse[]> {
  const tags = await findAllTags();
  return tags.map(toTagResponse);
}
