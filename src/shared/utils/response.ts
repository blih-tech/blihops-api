import type { Response } from 'express';
import type { Meta } from '../types/response.js';

export function sendSuccess<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({ data });
}

export function sendMany<T>(
  res: Response,
  items: T[],
  meta: Meta,
  status = 200,
): Response {
  return res.status(status).json({ items, meta });
}
