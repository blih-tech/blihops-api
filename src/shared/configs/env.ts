import { envSchema } from './envSchema.js';

export const env = envSchema.parse(process.env);
