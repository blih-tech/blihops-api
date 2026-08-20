import { Prisma } from '../../../generated/prisma/client.js';
import { prisma } from '../../../shared/db/prisma.js';

const listSelect = {
  id: true,
  fullName: true,
  primaryRole: true,
  seniority: true,
  englishLevel: true,
  visibility: true,
  isVerified: true,
  clientMonthlyRateEur: true,
  createdAt: true,
  updatedAt: true,
} as const;

export function findTalentProfileById(id: string) {
  return prisma.talentProfile.findUnique({
    where: { id },
    include: { talentAccount: true, application: { select: { id: true } } },
  });
}

export function findTalentProfileByApplicationId(applicationId: string) {
  return prisma.talentProfile.findUnique({ where: { applicationId } });
}

export function findTalentProfiles(
  where: Prisma.TalentProfileWhereInput,
  page: number,
  pageSize: number,
) {
  return Promise.all([
    prisma.talentProfile.findMany({
      where,
      select: {
        ...listSelect,
        talentAccount: { select: { status: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.talentProfile.count({ where }),
  ]);
}

export function isRecordNotFound(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025'
  );
}
