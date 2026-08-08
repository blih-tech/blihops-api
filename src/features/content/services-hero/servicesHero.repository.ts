import { prisma } from '../../../shared/db/prisma.js';

export const SERVICES_HERO_ID = 'global';

export function findServicesHero() {
  return prisma.servicesHeroMedia.findUnique({
    where: { id: SERVICES_HERO_ID },
  });
}

export function upsertServicesHero(data: {
  videoUrl: string;
  coverUrl: string;
  altLabel: string;
}) {
  return prisma.servicesHeroMedia.upsert({
    where: { id: SERVICES_HERO_ID },
    create: { id: SERVICES_HERO_ID, ...data },
    update: data,
  });
}
