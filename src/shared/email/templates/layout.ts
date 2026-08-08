type EmailLayoutParams = {
  logoUrl: string;
  heading: string;
  body: string;
  cta?: { label: string; href: string };
  footnote?: string;
};

const BRAND = '#3B82F6';
const FOREGROUND = '#333333';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';
const SURFACE = '#F9FAFB';

export function renderEmailLayout({
  logoUrl,
  heading,
  body,
  cta,
  footnote,
}: EmailLayoutParams): string {
  const logoHtml = `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
        <tr>
          <td align="center">
            <img src="${logoUrl}" alt="Blih Ops" width="168" height="39" style="display: block; border: 0; outline: none; text-decoration: none; width: 168px; height: 39px;" />
          </td>
        </tr>
      </table>`;
  const ctaHtml = cta
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
        <tr>
          <td align="center" style="border-radius: 6px; background-color: ${BRAND};">
            <a href="${cta.href}" style="display: inline-block; padding: 12px 28px; border-radius: 6px; background-color: ${BRAND}; color: #ffffff; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 600; text-decoration: none;">${cta.label}</a>
          </td>
        </tr>
      </table>`
    : '';

  const footnoteHtml = footnote
    ? `<p style="margin: 16px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.5; color: ${MUTED}; word-break: break-all;">${footnote}</p>`
    : '';

  return `
    <div style="background-color: ${SURFACE}; padding: 32px 16px;">
      <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border: 1px solid ${BORDER}; border-radius: 6px; padding: 32px;">
        ${logoHtml}
        <h1 style="margin: 0 0 16px; font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 600; color: ${FOREGROUND};">${heading}</h1>
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; color: ${FOREGROUND};">${body}</div>
        ${ctaHtml}
        ${footnoteHtml}
        <p style="margin: 24px 0 0; padding-top: 16px; border-top: 1px solid ${BORDER}; font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.5; color: ${MUTED};">Blih Ops &middot; Blih Intelligent Operations PLC</p>
      </div>
    </div>
  `.trim();
}
