import {
  Prisma,
  type LeadStatus,
  type LeadType,
} from '../../generated/prisma/client.js';
import { prisma } from '../../shared/db/prisma.js';

const leadListSelect = {
  id: true,
  type: true,
  status: true,
  fullName: true,
  workEmail: true,
  company: true,
  createdAt: true,
  updatedAt: true,
} as const;

export function isRecordNotFound(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025'
  );
}

export function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
  );
}

export function findLeadById(id: string) {
  return prisma.lead.findUnique({ where: { id } });
}

export function findByCalBookingUid(uid: string) {
  return prisma.lead.findUnique({ where: { calBookingUid: uid } });
}

export function findLeads(
  where: Prisma.LeadWhereInput,
  page: number,
  pageSize: number,
) {
  return Promise.all([
    prisma.lead.findMany({
      where,
      select: leadListSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.lead.count({ where }),
  ]);
}

export function createLeadRecord(data: {
  type: LeadType;
  status: LeadStatus;
  fullName: string;
  workEmail: string;
  company: string | null;
  calBookingUid?: string | null;
  details: Prisma.InputJsonValue;
}) {
  return prisma.lead.create({ data });
}

export function updateLeadRecord(
  id: string,
  data: {
    status?: LeadStatus;
    details?: Prisma.InputJsonValue;
    calBookingUid?: string;
  },
) {
  return prisma.lead.update({ where: { id }, data });
}

export function deleteLeadRecord(id: string) {
  return prisma.lead.delete({ where: { id } });
}
