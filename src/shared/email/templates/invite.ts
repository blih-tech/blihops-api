import { renderEmailLayout } from './layout.js';

export type InviteRole = 'admin' | 'client' | 'talent';

export type InviteTemplate = {
  subject: string;
  html: string;
  text: string;
};

const ROLE_LABELS: Record<InviteRole, string> = {
  admin: 'the Blih Ops admin console',
  client: 'your Blih Ops client workspace',
  talent: 'your Blih Ops talent portal',
};

export function inviteTemplate(
  inviteUrl: string,
  invitedName: string,
  role: InviteRole,
): InviteTemplate {
  const area = ROLE_LABELS[role];

  return {
    subject: `You've been invited to ${area}`,
    html: renderEmailLayout({
      heading: "You're invited",
      body: `
        <p style="margin: 0;">Hi ${invitedName},</p>
        <p style="margin: 12px 0 0;">You've been invited to join ${area}. Click the button below to activate your account and set your password. This link is single-use and expires shortly.</p>
      `,
      cta: { label: 'Activate your account', href: inviteUrl },
      footnote: `If the button doesn't work, copy and paste this link into your browser: ${inviteUrl}`,
    }),
    text: `Hi ${invitedName},\n\nYou've been invited to join ${area}. Activate your account here:\n${inviteUrl}\n\nThis link is single-use and expires shortly.`,
  };
}
