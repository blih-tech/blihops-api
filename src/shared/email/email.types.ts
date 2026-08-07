export type EmailMessage = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

export type EmailSendResult = {
  id: string;
};

export interface EmailClient {
  send(message: EmailMessage): Promise<EmailSendResult>;
}
