import type { ServicesHeroMedia } from '../../../generated/prisma/client.js';
import type { ServicesHeroResponse } from './servicesHero.schema.js';
import { findServicesHero } from './servicesHero.repository.js';

function toServicesHeroResponse(hero: ServicesHeroMedia): ServicesHeroResponse {
  return {
    id: hero.id,
    videoUrl: hero.videoUrl,
    coverUrl: hero.coverUrl,
    altLabel: hero.altLabel,
    lastUpdatedAt: hero.updatedAt.toISOString(),
  };
}

export { toServicesHeroResponse };

export async function getServicesHero(): Promise<ServicesHeroResponse | null> {
  const hero = await findServicesHero();
  return hero === null ? null : toServicesHeroResponse(hero);
}
