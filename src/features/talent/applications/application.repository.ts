import { Prisma } from '../../../generated/prisma/client.js';
import { prisma } from '../../../shared/db/prisma.js';

const listSelect = {
  id: true,
  status: true,
  fullName: true,
  workEmail: true,
  phone: true,
  country: true,
  city: true,
  primaryRole: true,
  yearsExperience: true,
  createdAt: true,
  updatedAt: true,
} as const;

export function isRecordNotFound(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025'
  );
}

export function findTalentApplicationById(id: string) {
  return prisma.talentApplication.findUnique({
    where: { id },
    include: { talentProfile: { select: { id: true } } },
  });
}

export function findTalentApplications(
  where: Prisma.TalentApplicationWhereInput,
  page: number,
  pageSize: number,
) {
  return Promise.all([
    prisma.talentApplication.findMany({
      where,
      select: listSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.talentApplication.count({ where }),
  ]);
}

export function createTalentApplicationRecord(data: {
  fullName: string;
  workEmail: string;
  phone: string;
  country: string;
  city: string;
  primaryRole: string;
  techStack: string[];
  secondarySkills: string[];
  yearsExperience: number;
  portfolioUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  resumeFileKey: string;
}) {
  return prisma.talentApplication.create({ data });
}

export function updateTalentApplicationStatus(id: string, status: string) {
  return prisma.talentApplication.update({
    where: { id },
    data: { status: status as never },
  });
}

export function updateTalentApplicationNotes(
  id: string,
  internalNotes: string,
) {
  return prisma.talentApplication.update({
    where: { id },
    data: { internalNotes },
  });
}
