import type { EmailClient } from './email.types.js';
import { ResendEmailClient } from './resend.client.js';
import { NoopEmailClient } from './noop.client.js';
import { env } from '../configs/env.js';

export function createEmailClient(): EmailClient {
  if (env.NODE_ENV === 'test' || env.RESEND_API_KEY === undefined) {
    return new NoopEmailClient();
  }
  return new ResendEmailClient(env.RESEND_API_KEY, env.EMAIL_FROM);
}
