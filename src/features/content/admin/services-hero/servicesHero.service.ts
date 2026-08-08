import { upsertServicesHero } from '../../services-hero/servicesHero.repository.js';

export type PutServicesHeroPayload = {
  videoUrl: string;
  coverUrl: string;
  altLabel: string;
};

export function saveServicesHero(payload: PutServicesHeroPayload) {
  return upsertServicesHero(payload);
}
