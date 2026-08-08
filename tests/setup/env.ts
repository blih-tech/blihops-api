import 'dotenv/config';

process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
process.env.BETTER_AUTH_SECRET ??=
  'test-better-auth-secret-must-be-at-least-32-chars';
process.env.API_URL ??= 'http://localhost:4000';
process.env.WEB_URL ??= 'http://localhost:3000';
process.env.CORS_ORIGIN ??= 'http://localhost:3000';
process.env.RESEND_API_KEY ??= 're_test_placeholder';
process.env.EMAIL_FROM ??= 'Blih Ops <noreply@mail.blihops.com>';
process.env.EMAIL_LOGO_URL ??= 'https://blihops.com/logo.png';
