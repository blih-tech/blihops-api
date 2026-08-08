import type { Testimonial } from '../../../generated/prisma/client.js';
import type { TestimonialResponse } from './testimonial.schema.js';
import { findAllTestimonials } from './testimonial.repository.js';

function toTestimonialResponse(testimonial: Testimonial): TestimonialResponse {
  return {
    id: testimonial.id,
    avatarUrl: testimonial.avatarUrl,
    name: testimonial.name,
    role: testimonial.role,
    company: testimonial.company,
    quote: testimonial.quote,
    isPrimary: testimonial.isPrimary,
  };
}

export { toTestimonialResponse };

export async function listTestimonials(): Promise<TestimonialResponse[]> {
  const testimonials = await findAllTestimonials();
  return testimonials.map(toTestimonialResponse);
}
