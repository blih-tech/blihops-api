import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../configs/env.js';
import { PrismaClient } from '../../generated/prisma/client.js';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
