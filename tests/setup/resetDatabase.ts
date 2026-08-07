import type { PrismaClient } from '../../src/generated/prisma/client.js';

export async function resetDatabase(prisma: PrismaClient) {
  const tables = (
    await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
    `
  ).map((row) => row.tablename);

  if (tables.length === 0) return;

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`,
  );
}
