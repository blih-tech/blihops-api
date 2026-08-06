import { ValidationError } from '../errors/httpErrors.js';
import { envSchema } from './envSchema.js';

export const env = (() => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw ValidationError.fromZod(result.error);
  }
  return result.data;
})();
