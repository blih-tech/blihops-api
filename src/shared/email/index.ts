export type {
  EmailClient,
  EmailMessage,
  EmailSendResult,
} from './email.types.js';
export { createEmailClient } from './factory.js';
export { NoopEmailClient } from './noop.client.js';
export { ResendEmailClient } from './resend.client.js';
export { isOriginAllowed, isResetUrlAllowed } from './guards.js';
export { resetPasswordTemplate } from './templates/reset-password.js';
