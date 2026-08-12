import type { Service as ServiceRow } from '../../../generated/prisma/client.js';
import type { ServiceDetail } from './service.schema.js';
import { findServices } from './service.repository.js';

function toServiceDetail(service: ServiceRow): ServiceDetail {
  return {
    id: service.id,
    icon: service.icon,
    imageUrl: service.imageUrl,
    alt: service.alt,
    displayOrder: service.displayOrder,
    content: service.content as ServiceDetail['content'],
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  };
}

export { toServiceDetail };

export async function listAllServices(): Promise<ServiceDetail[]> {
  const services = await findServices();
  return services.map(toServiceDetail);
}
