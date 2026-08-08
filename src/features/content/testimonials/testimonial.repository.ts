import { prisma } from '../../../shared/db/prisma.js';

export function findAllTestimonials() {
  return prisma.testimonial.findMany({
    orderBy: { createdAt: 'asc' },
  });
}
