import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'p',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'strong',
  'em',
  'a',
  'br',
];

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https'],
  });
}
