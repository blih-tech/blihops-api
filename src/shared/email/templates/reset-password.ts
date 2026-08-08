import { renderEmailLayout } from './layout.js';

export type ResetPasswordTemplate = {
  subject: string;
  html: string;
  text: string;
};

export function resetPasswordTemplate(
  logoUrl: string,
  resetUrl: string,
): ResetPasswordTemplate {
  return {
    subject: 'Reset your Blih Ops password',
    html: renderEmailLayout({
      logoUrl,
      heading: 'Reset your password',
      body: `
        <p style="margin: 0;">We received a request to reset the password for your Blih Ops account. Click the button below to choose a new password. This link is single-use and expires shortly.</p>
        <p style="margin: 12px 0 0;">If you didn't request this, you can safely ignore this email — your password will stay the same.</p>
      `,
      cta: { label: 'Reset password', href: resetUrl },
      footnote: `If the button doesn't work, copy and paste this link into your browser: ${resetUrl}`,
    }),
    text: `Reset your Blih Ops password:\n${resetUrl}\n\nThis link is single-use and expires shortly. If you didn't request this, you can safely ignore this email.`,
  };
}
