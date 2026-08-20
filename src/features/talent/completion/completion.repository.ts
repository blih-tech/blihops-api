import { prisma } from '../../../shared/db/prisma.js';

export function findApplicationById(id: string) {
  return prisma.talentApplication.findUnique({ where: { id } });
}

export function findCompletionByTokenHash(tokenHash: string) {
  return prisma.profileCompletionRequest.findFirst({
    where: { tokenHash },
    include: { application: true },
  });
}

export function findPendingCompletionByApplicationId(applicationId: string) {
  return prisma.profileCompletionRequest.findFirst({
    where: { applicationId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });
}

export function createCompletionRequest(data: {
  applicationId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  return prisma.profileCompletionRequest.create({ data });
}

export function updateCompletionRequest(
  id: string,
  data: Record<string, unknown>,
) {
  return prisma.profileCompletionRequest.update({
    where: { id },
    data: data as never,
  });
}

export function updateApplicationCompletion(
  id: string,
  data: {
    completionPhotoKey: string;
    completionShortBio: string;
    completionProfessionalHeadline: string;
    completionSubmittedAt: Date;
    status: string;
  },
) {
  return prisma.talentApplication.update({
    where: { id },
    data: {
      completionPhotoKey: data.completionPhotoKey,
      completionShortBio: data.completionShortBio,
      completionProfessionalHeadline: data.completionProfessionalHeadline,
      completionSubmittedAt: data.completionSubmittedAt,
      status: data.status as never,
    },
  });
}

export function setApplicationStatus(id: string, status: string) {
  return prisma.talentApplication.update({
    where: { id },
    data: { status: status as never },
  });
}
