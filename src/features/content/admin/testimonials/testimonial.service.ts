import { prisma } from '../../../../shared/db/prisma.js';
import {
  ConflictError,
  NotFoundError,
} from '../../../../shared/errors/httpErrors.js';
import { isRecordNotFound } from '../../common/prismaErrors.js';
import type { TestimonialResponse } from '../../testimonials/testimonial.schema.js';
import { toTestimonialResponse } from '../../testimonials/testimonial.service.js';
import {
  clearPrimaryTestimonial,
  createTestimonialRecord,
  deleteNonPrimaryTestimonial,
  findTestimonialById,
  type TestimonialData,
  updateTestimonialRecord,
} from './testimonial.repository.js';

export type CreateTestimonialPayload = TestimonialData;
export type UpdateTestimonialPayload = Partial<TestimonialData> & {
  isPrimary?: true;
};

export async function createTestimonial(
  payload: CreateTestimonialPayload,
): Promise<TestimonialResponse> {
  const testimonial = await createTestimonialRecord(payload);
  return toTestimonialResponse(testimonial);
}

export async function updateTestimonial(
  id: string,
  payload: UpdateTestimonialPayload,
): Promise<TestimonialResponse> {
  const existing = await findTestimonialById(id);
  if (existing === null) {
    throw new NotFoundError('Testimonial not found');
  }

  const merged: TestimonialData = {
    avatarUrl: payload.avatarUrl ?? existing.avatarUrl,
    name: payload.name ?? existing.name,
    role: payload.role ?? existing.role,
    company: payload.company ?? existing.company,
    quote: payload.quote ?? existing.quote,
  };

  try {
    if (payload.isPrimary === true) {
      const [, updated] = await prisma.$transaction([
        clearPrimaryTestimonial(),
        updateTestimonialRecord(id, { ...merged, isPrimary: true }),
      ]);
      return toTestimonialResponse(updated);
    }

    const updated = await updateTestimonialRecord(id, merged);
    return toTestimonialResponse(updated);
  } catch (err) {
    if (isRecordNotFound(err)) {
      throw new NotFoundError('Testimonial not found');
    }
    throw err;
  }
}

export async function deleteTestimonial(id: string): Promise<void> {
  const deleted = await deleteNonPrimaryTestimonial(id);
  if (deleted.count > 0) {
    return;
  }

  const existing = await findTestimonialById(id);
  if (existing === null) {
    throw new NotFoundError('Testimonial not found');
  }
  throw new ConflictError(
    'The primary testimonial cannot be deleted until another testimonial is set as primary',
  );
}
