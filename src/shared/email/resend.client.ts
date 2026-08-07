import { Resend } from 'resend';

import type {
  EmailClient,
  EmailMessage,
  EmailSendResult,
} from './email.types.js';
import { AppError } from '../errors/AppError.js';
import { logger } from '../configs/logger.js';

export class ResendEmailClient implements EmailClient {
  private readonly resend: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.resend = new Resend(apiKey);
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const base = {
      from: this.from,
      to: message.to,
      subject: message.subject,
    } as const;

    const payload =
      message.html !== undefined
        ? {
            ...base,
            html: message.html,
            ...(message.text !== undefined ? { text: message.text } : {}),
          }
        : { ...base, text: message.text ?? '' };

    const { data, error } = await this.resend.emails.send(payload);

    if (error) {
      logger.warn({ err: error }, 'resend email delivery failed');
      throw new AppError('Email delivery failed', {
        code: 'EMAIL_DELIVERY_FAILED',
        statusCode: 502,
        cause: error,
      });
    }

    return { id: data?.id ?? '' };
  }
}
