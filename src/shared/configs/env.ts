import { envSchema } from './envSchema.js';

export const env = (() => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => {
        const path = issue.path.join('.');
        return path === '' ? issue.message : `${path}: ${issue.message}`;
      })
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return result.data;
})();
