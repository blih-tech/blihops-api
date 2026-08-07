import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../src/shared/db/prisma.js';
import { resetDatabase } from '../setup/resetDatabase.js';

describe('prisma <-> testcontainers db', () => {
  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  it('connects and queries', async () => {
    const rows = await prisma.$queryRaw<{ one: number }[]>`SELECT 1 AS one`;

    expect(rows[0]?.one).toBe(1);
  });
});
