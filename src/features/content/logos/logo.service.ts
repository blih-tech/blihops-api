import type { TrustedLogo } from '../../../generated/prisma/client.js';
import type { LogoResponse } from './logo.schema.js';
import { findAllLogos } from './logo.repository.js';

function toLogoResponse(logo: TrustedLogo): LogoResponse {
  return {
    id: logo.id,
    imageUrl: logo.imageUrl,
    alt: logo.alt,
  };
}

export { toLogoResponse };

export async function listLogos(): Promise<LogoResponse[]> {
  const logos = await findAllLogos();
  return logos.map(toLogoResponse);
}
