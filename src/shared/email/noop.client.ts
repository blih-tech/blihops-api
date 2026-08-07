import type {
  EmailClient,
  EmailMessage,
  EmailSendResult,
} from './email.types.js';
import { logger } from '../configs/logger.js';

export class NoopEmailClient implements EmailClient {
  readonly sent: EmailMessage[] = [];

  send(message: EmailMessage): Promise<EmailSendResult> {
    this.sent.push(message);
    logger.debug(
      { to: message.to, subject: message.subject },
      'email recorded',
    );
    return Promise.resolve({ id: `noop-${this.sent.length}` });
  }
}
