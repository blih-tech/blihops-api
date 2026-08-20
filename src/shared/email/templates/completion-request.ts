import { renderEmailLayout } from './layout.js';

export type CompletionRequestTemplate = {
  subject: string;
  html: string;
  text: string;
};

export function completionRequestTemplate(
  logoUrl: string,
  completionUrl: string,
  candidateName: string,
): CompletionRequestTemplate {
  return {
    subject: 'Complete your BlihOps profile',
    html: renderEmailLayout({
      logoUrl,
      heading: 'Complete your profile',
      body: `
        <p style="margin: 0;">Hi ${candidateName},</p>
        <p style="margin: 12px 0 0;">Congratulations — your Talent Application has been approved. Please complete your profile by adding your profile photo, short bio, and professional headline using the link below. This link is single-use and expires in 7 days.</p>
      `,
      cta: { label: 'Complete your profile', href: completionUrl },
      footnote: `If the button doesn't work, copy and paste this link into your browser: ${completionUrl}`,
    }),
    text: `Hi ${candidateName},\n\nYour Talent Application has been approved. Complete your profile here:\n${completionUrl}\n\nThis link is single-use and expires in 7 days.`,
  };
}
