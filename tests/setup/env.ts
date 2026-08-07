import 'dotenv/config';

process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET ??= 'test-jwt-secret-must-be-at-least-32-characters';
process.env.API_URL ??= 'http://localhost:4000';
process.env.CORS_ORIGIN ??= 'http://localhost:3000';
