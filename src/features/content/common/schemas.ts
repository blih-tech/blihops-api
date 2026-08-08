import { z } from 'zod';

export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Keep the name under 100 characters');

export const idParamSchema = z.string().min(1, 'Id is required').max(50);

export const metaSchema = z.record(z.string(), z.unknown());
