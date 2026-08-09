import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../../src/app.js';
import { prisma } from '../../../src/shared/db/prisma.js';
import { createAdminSession, createClientSession } from '../../helpers/auth.js';
import { resetDatabase } from '../../setup/resetDatabase.js';

const PUBLIC_CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=300';

type TestimonialItem = {
  id: string;
  avatarUrl: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  isPrimary: boolean;
};

type ListBody = {
  items: TestimonialItem[];
  meta: Record<string, unknown>;
};

type SingleBody = {
  data: TestimonialItem;
};

type ErrorBody = {
  error: { code: string; message: string; details?: unknown[] };
};

const asList = (body: unknown) => body as ListBody;
const asSingle = (body: unknown) => body as SingleBody;
const asError = (body: unknown) => body as ErrorBody;

const testimonialData = {
  avatarUrl: 'https://example.com/avatar.jpg',
  name: 'Sarah Chen',
  role: 'Head of Operations',
  company: 'Northline',
  quote: 'Blih Ops took support off our plate in two weeks.',
};

const createTestimonial = (
  data: Partial<typeof testimonialData> & { isPrimary?: boolean } = {},
) =>
  prisma.testimonial.create({
    data: { ...testimonialData, ...data },
  });

describe('testimonials resource', () => {
  let adminCookie: string;
  let clientCookie: string;

  beforeAll(async () => {
    adminCookie = (await createAdminSession()).cookie;
    clientCookie = await createClientSession();
  });

  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  describe('GET /api/v1/content/testimonials (public)', () => {
    it('returns an empty list with empty meta without a session', async () => {
      const res = await request(app)
        .get('/api/v1/content/testimonials')
        .expect(200);

      expect(res.body).toEqual({ items: [], meta: {} });
    });

    it('returns testimonials in creation order with the primary flag', async () => {
      const first = await createTestimonial();
      const second = await createTestimonial({ isPrimary: true });

      const res = await request(app)
        .get('/api/v1/content/testimonials')
        .expect(200);

      const items = asList(res.body).items;
      expect(items.map((item) => item.id)).toEqual([first.id, second.id]);
      expect(items[1]).toMatchObject({ isPrimary: true });
    });

    it('sets public cache headers', async () => {
      const res = await request(app).get('/api/v1/content/testimonials');

      expect(res.headers['cache-control']).toBe(PUBLIC_CACHE_CONTROL);
    });
  });

  describe('GET /api/v1/content/admin/testimonials', () => {
    it('returns 401 without a session', async () => {
      await request(app).get('/api/v1/content/admin/testimonials').expect(401);
    });

    it('returns 403 for a client session', async () => {
      await request(app)
        .get('/api/v1/content/admin/testimonials')
        .set('cookie', clientCookie)
        .expect(403);
    });

    it('returns all testimonials for an admin', async () => {
      await createTestimonial();

      const res = await request(app)
        .get('/api/v1/content/admin/testimonials')
        .set('cookie', adminCookie)
        .expect(200);

      expect(asList(res.body).items).toHaveLength(1);
      expect(asList(res.body).items[0]).toMatchObject({ name: 'Sarah Chen' });
    });
  });

  describe('POST /api/v1/content/admin/testimonials', () => {
    it('creates a testimonial that is not primary by default', async () => {
      const res = await request(app)
        .post('/api/v1/content/admin/testimonials')
        .set('cookie', adminCookie)
        .send(testimonialData)
        .expect(201);

      expect(asSingle(res.body).data).toMatchObject({
        ...testimonialData,
        isPrimary: false,
      });
      expect(asSingle(res.body).data.id).toBeTypeOf('string');
    });

    it('returns 422 when the avatar URL is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/content/admin/testimonials')
        .set('cookie', adminCookie)
        .send({ ...testimonialData, avatarUrl: 'not-a-url' })
        .expect(422);

      expect(asError(res.body).error.details).toBeDefined();
    });

    it('returns 422 when the quote is missing', async () => {
      const { quote: _quote, ...withoutQuote } = testimonialData;
      void _quote;

      await request(app)
        .post('/api/v1/content/admin/testimonials')
        .set('cookie', adminCookie)
        .send(withoutQuote)
        .expect(422);
    });

    it('returns 422 when the quote exceeds 2000 characters', async () => {
      await request(app)
        .post('/api/v1/content/admin/testimonials')
        .set('cookie', adminCookie)
        .send({ ...testimonialData, quote: 'x'.repeat(2001) })
        .expect(422);
    });

    it('returns 401 without a session', async () => {
      await request(app)
        .post('/api/v1/content/admin/testimonials')
        .send(testimonialData)
        .expect(401);
    });
  });

  describe('PATCH /api/v1/content/admin/testimonials/:id', () => {
    it('updates only the quote', async () => {
      const testimonial = await createTestimonial();

      const res = await request(app)
        .patch(`/api/v1/content/admin/testimonials/${testimonial.id}`)
        .set('cookie', adminCookie)
        .send({ quote: 'A new quote.' })
        .expect(200);

      expect(asSingle(res.body).data.quote).toBe('A new quote.');
      expect(asSingle(res.body).data.name).toBe('Sarah Chen');
    });

    it('sets the testimonial as primary and clears the previous primary', async () => {
      const first = await createTestimonial({ isPrimary: true });
      const second = await createTestimonial();

      const res = await request(app)
        .patch(`/api/v1/content/admin/testimonials/${second.id}`)
        .set('cookie', adminCookie)
        .send({ isPrimary: true })
        .expect(200);

      expect(asSingle(res.body).data.isPrimary).toBe(true);

      const rows = await prisma.testimonial.findMany({
        orderBy: { createdAt: 'asc' },
      });
      expect(rows[0]).toMatchObject({ id: first.id, isPrimary: false });
      expect(rows[1]).toMatchObject({ id: second.id, isPrimary: true });
      expect(rows.filter((row) => row.isPrimary)).toHaveLength(1);
    });

    it('returns 422 when isPrimary is false', async () => {
      const testimonial = await createTestimonial();

      await request(app)
        .patch(`/api/v1/content/admin/testimonials/${testimonial.id}`)
        .set('cookie', adminCookie)
        .send({ isPrimary: false })
        .expect(422);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .patch('/api/v1/content/admin/testimonials/does-not-exist')
        .set('cookie', adminCookie)
        .send({ quote: 'A new quote.' })
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });

    it('returns 422 when no fields are provided', async () => {
      const testimonial = await createTestimonial();

      await request(app)
        .patch(`/api/v1/content/admin/testimonials/${testimonial.id}`)
        .set('cookie', adminCookie)
        .send({})
        .expect(422);
    });

    it('returns 401 without a session', async () => {
      const testimonial = await createTestimonial();

      await request(app)
        .patch(`/api/v1/content/admin/testimonials/${testimonial.id}`)
        .send({ quote: 'A new quote.' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/content/admin/testimonials/:id', () => {
    it('deletes a non-primary testimonial with 204 and no body', async () => {
      const testimonial = await createTestimonial();

      const res = await request(app)
        .delete(`/api/v1/content/admin/testimonials/${testimonial.id}`)
        .set('cookie', adminCookie)
        .expect(204);

      expect(res.body).toEqual({});
      await expect(prisma.testimonial.count()).resolves.toBe(0);
    });

    it('returns 409 when deleting the primary testimonial', async () => {
      const primary = await createTestimonial({ isPrimary: true });

      const res = await request(app)
        .delete(`/api/v1/content/admin/testimonials/${primary.id}`)
        .set('cookie', adminCookie)
        .expect(409);

      expect(asError(res.body).error.code).toBe(
        'CONTENT_PRIMARY_DELETE_BLOCKED',
      );
      await expect(prisma.testimonial.count()).resolves.toBe(1);
    });

    it('deletes the primary testimonial after a replacement is set', async () => {
      const primary = await createTestimonial({ isPrimary: true });
      const replacement = await createTestimonial();

      await request(app)
        .patch(`/api/v1/content/admin/testimonials/${replacement.id}`)
        .set('cookie', adminCookie)
        .send({ isPrimary: true })
        .expect(200);

      await request(app)
        .delete(`/api/v1/content/admin/testimonials/${primary.id}`)
        .set('cookie', adminCookie)
        .expect(204);

      const remaining = await prisma.testimonial.findFirstOrThrow();
      expect(remaining).toMatchObject({ id: replacement.id, isPrimary: true });
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .delete('/api/v1/content/admin/testimonials/does-not-exist')
        .set('cookie', adminCookie)
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });

    it('returns 401 without a session', async () => {
      const testimonial = await createTestimonial();

      await request(app)
        .delete(`/api/v1/content/admin/testimonials/${testimonial.id}`)
        .expect(401);
    });

    it('returns 403 for a client session', async () => {
      const testimonial = await createTestimonial();

      await request(app)
        .delete(`/api/v1/content/admin/testimonials/${testimonial.id}`)
        .set('cookie', clientCookie)
        .expect(403);
    });
  });
});
