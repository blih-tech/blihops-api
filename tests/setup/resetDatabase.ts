import type { PrismaClient } from '../../src/generated/prisma/client.js';

const KEEP_TABLES = new Set([
  '_prisma_migrations',
  'User',
  'Account',
  'Session',
  'Verification',
]);

export async function resetDatabase(prisma: PrismaClient) {
  const tables = (
    await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
    `
  )
    .map((row) => row.tablename)
    .filter((table) => !KEEP_TABLES.has(table));

  if (tables.length === 0) return;

  const quoted = tables.map((table) => `"${table}"`).join(', ');

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`,
  );
}
