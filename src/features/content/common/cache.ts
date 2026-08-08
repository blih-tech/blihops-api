import type { Response } from 'express';

const PUBLIC_CONTENT_CACHE_CONTROL =
  'public, max-age=300, stale-while-revalidate=300';

export function setPublicCache(res: Response): void {
  res.setHeader('Cache-Control', PUBLIC_CONTENT_CACHE_CONTROL);
}
