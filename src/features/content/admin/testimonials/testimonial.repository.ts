import { prisma } from '../../../../shared/db/prisma.js';

export type TestimonialData = {
  avatarUrl: string;
  name: string;
  role: string;
  company: string;
  quote: string;
};

export function createTestimonialRecord(data: TestimonialData) {
  return prisma.testimonial.create({ data });
}

export function findTestimonialById(id: string) {
  return prisma.testimonial.findUnique({ where: { id } });
}

export function updateTestimonialRecord(
  id: string,
  data: TestimonialData & { isPrimary?: boolean },
) {
  return prisma.testimonial.update({ where: { id }, data });
}

export function clearPrimaryTestimonial() {
  return prisma.testimonial.updateMany({
    where: { isPrimary: true },
    data: { isPrimary: false },
  });
}

export function deleteNonPrimaryTestimonial(id: string) {
  return prisma.testimonial.deleteMany({
    where: { id, isPrimary: false },
  });
}
