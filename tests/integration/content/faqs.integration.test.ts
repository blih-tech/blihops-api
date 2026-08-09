import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../../src/app.js';
import { prisma } from '../../../src/shared/db/prisma.js';
import { createAdminSession, createClientSession } from '../../helpers/auth.js';
import { resetDatabase } from '../../setup/resetDatabase.js';

const PUBLIC_CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=300';

const faqData = {
  en: {
    question: 'Is the pilot free?',
    answer: '<p>Yes, the pilot is free.</p>',
  },
  de: {
    question: 'Ist der Pilot kostenlos?',
    answer: '<p>Ja, der Pilot ist kostenlos.</p>',
  },
  displayOrder: 1,
};

type FaqItem = {
  id: string;
  isActive: boolean;
  displayOrder: number;
  content: {
    en: { question: string; answer: string };
    de: { question: string; answer: string };
  };
};

type ListBody = {
  items: FaqItem[];
  meta: Record<string, unknown>;
};

type SingleBody = {
  data: FaqItem;
};

type ErrorBody = {
  error: {
    code: string;
    message: string;
    details?: { path?: string; message: string }[];
  };
};

const asList = (body: unknown) => body as ListBody;
const asSingle = (body: unknown) => body as SingleBody;
const asError = (body: unknown) => body as ErrorBody;

const createFaq = (
  overrides: Partial<typeof faqData> & { isActive?: boolean } = {},
) =>
  prisma.pilotFaq.create({
    data: {
      content: {
        en: overrides.en ?? faqData.en,
        de: overrides.de ?? faqData.de,
      },
      displayOrder: overrides.displayOrder ?? faqData.displayOrder,
      isActive: overrides.isActive ?? false,
    },
  });

describe('pilot faqs resource', () => {
  let adminCookie: string;
  let clientCookie: string;

  beforeAll(async () => {
    adminCookie = (await createAdminSession()).cookie;
    clientCookie = await createClientSession();
  });

  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  describe('GET /api/v1/content/faqs (public)', () => {
    it('returns an empty list with empty meta', async () => {
      const res = await request(app).get('/api/v1/content/faqs').expect(200);

      expect(res.body).toEqual({ items: [], meta: {} });
    });

    it('returns only active FAQs', async () => {
      await createFaq({ displayOrder: 1 });
      await createFaq({ displayOrder: 2, isActive: true });

      const res = await request(app).get('/api/v1/content/faqs').expect(200);

      const items = asList(res.body).items;
      expect(items).toHaveLength(1);
      expect(items[0]?.displayOrder).toBe(2);
    });

    it('returns active FAQs in display order', async () => {
      await createFaq({ displayOrder: 3, isActive: true });
      await createFaq({ displayOrder: 1, isActive: true });
      await createFaq({ displayOrder: 2, isActive: true });

      const res = await request(app).get('/api/v1/content/faqs').expect(200);

      expect(asList(res.body).items.map((item) => item.displayOrder)).toEqual([
        1, 2, 3,
      ]);
    });

    it('returns both locales for each FAQ', async () => {
      await createFaq({ isActive: true });

      const res = await request(app).get('/api/v1/content/faqs').expect(200);

      const item = asList(res.body).items[0];
      expect(item?.content.en.question).toBe('Is the pilot free?');
      expect(item?.content.de.question).toBe('Ist der Pilot kostenlos?');
    });

    it('sets public cache headers', async () => {
      const res = await request(app).get('/api/v1/content/faqs');

      expect(res.headers['cache-control']).toBe(PUBLIC_CACHE_CONTROL);
    });
  });

  describe('GET /api/v1/content/admin/faqs', () => {
    it('returns 401 without a session', async () => {
      await request(app).get('/api/v1/content/admin/faqs').expect(401);
    });

    it('returns 403 for a client session', async () => {
      await request(app)
        .get('/api/v1/content/admin/faqs')
        .set('cookie', clientCookie)
        .expect(403);
    });

    it('returns all FAQs regardless of active state in display order', async () => {
      await createFaq({ displayOrder: 2, isActive: true });
      await createFaq({ displayOrder: 1 });

      const res = await request(app)
        .get('/api/v1/content/admin/faqs')
        .set('cookie', adminCookie)
        .expect(200);

      const items = asList(res.body).items;
      expect(items).toHaveLength(2);
      expect(items.map((item) => item.displayOrder)).toEqual([1, 2]);
    });
  });

  describe('GET /api/v1/content/admin/faqs/:id', () => {
    it('returns the FAQ for an admin', async () => {
      const faq = await createFaq();

      const res = await request(app)
        .get(`/api/v1/content/admin/faqs/${faq.id}`)
        .set('cookie', adminCookie)
        .expect(200);

      expect(asSingle(res.body).data).toMatchObject({
        displayOrder: 1,
        isActive: false,
      });
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .get('/api/v1/content/admin/faqs/does-not-exist')
        .set('cookie', adminCookie)
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/v1/content/admin/faqs', () => {
    it('creates an inactive FAQ with both locales required', async () => {
      const res = await request(app)
        .post('/api/v1/content/admin/faqs')
        .set('cookie', adminCookie)
        .send(faqData)
        .expect(201);

      expect(asSingle(res.body).data).toMatchObject({
        displayOrder: 1,
        isActive: false,
      });
      expect(asSingle(res.body).data.id).toBeTypeOf('string');
    });

    it('returns 422 when the de locale is missing', async () => {
      const { de: _de, ...withoutDe } = faqData;
      void _de;

      const res = await request(app)
        .post('/api/v1/content/admin/faqs')
        .set('cookie', adminCookie)
        .send(withoutDe)
        .expect(422);

      expect(asError(res.body).error.details).toBeDefined();
    });

    it('returns 422 when the question is empty', async () => {
      await request(app)
        .post('/api/v1/content/admin/faqs')
        .set('cookie', adminCookie)
        .send({ ...faqData, en: { question: '', answer: '<p>Yes.</p>' } })
        .expect(422);
    });

    it('returns 422 for a negative display order', async () => {
      await request(app)
        .post('/api/v1/content/admin/faqs')
        .set('cookie', adminCookie)
        .send({ ...faqData, displayOrder: -1 })
        .expect(422);
    });

    it('returns 401 without a session', async () => {
      await request(app)
        .post('/api/v1/content/admin/faqs')
        .send(faqData)
        .expect(401);
    });
  });

  describe('PATCH /api/v1/content/admin/faqs/:id', () => {
    it('updates one locale without touching the other', async () => {
      const faq = await createFaq();

      const res = await request(app)
        .patch(`/api/v1/content/admin/faqs/${faq.id}`)
        .set('cookie', adminCookie)
        .send({
          en: {
            question: 'Updated EN question?',
            answer: '<p>Updated answer.</p>',
          },
        })
        .expect(200);

      const data = asSingle(res.body).data;
      expect(data.content.en.question).toBe('Updated EN question?');
      expect(data.content.de.question).toBe('Ist der Pilot kostenlos?');
    });

    it('reorders an FAQ', async () => {
      const faq = await createFaq();

      const res = await request(app)
        .patch(`/api/v1/content/admin/faqs/${faq.id}`)
        .set('cookie', adminCookie)
        .send({ displayOrder: 5 })
        .expect(200);

      expect(asSingle(res.body).data.displayOrder).toBe(5);
    });

    it('activates a complete FAQ and makes it publicly visible', async () => {
      const faq = await createFaq();

      const res = await request(app)
        .patch(`/api/v1/content/admin/faqs/${faq.id}`)
        .set('cookie', adminCookie)
        .send({ isActive: true })
        .expect(200);

      expect(asSingle(res.body).data.isActive).toBe(true);

      const publicRes = await request(app)
        .get('/api/v1/content/faqs')
        .expect(200);
      expect(asList(publicRes.body).items).toHaveLength(1);
    });

    it('returns 422 when activating an incomplete FAQ', async () => {
      const faq = await createFaq();
      await prisma.pilotFaq.update({
        where: { id: faq.id },
        data: { content: { en: faqData.en } },
      });

      const res = await request(app)
        .patch(`/api/v1/content/admin/faqs/${faq.id}`)
        .set('cookie', adminCookie)
        .send({ isActive: true })
        .expect(422);

      const details = asError(res.body).error.details ?? [];
      expect(details.map((detail) => detail.path)).toContain('de.question');
      expect(details.map((detail) => detail.path)).toContain('de.answer');
    });

    it('deactivates an FAQ and hides it from the public', async () => {
      const faq = await createFaq({ isActive: true });

      await request(app)
        .patch(`/api/v1/content/admin/faqs/${faq.id}`)
        .set('cookie', adminCookie)
        .send({ isActive: false })
        .expect(200);

      const publicRes = await request(app)
        .get('/api/v1/content/faqs')
        .expect(200);
      expect(asList(publicRes.body).items).toHaveLength(0);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .patch('/api/v1/content/admin/faqs/does-not-exist')
        .set('cookie', adminCookie)
        .send({ displayOrder: 2 })
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });

    it('returns 422 for an empty body', async () => {
      const faq = await createFaq();

      await request(app)
        .patch(`/api/v1/content/admin/faqs/${faq.id}`)
        .set('cookie', adminCookie)
        .send({})
        .expect(422);
    });

    it('returns 401 without a session', async () => {
      const faq = await createFaq();

      await request(app)
        .patch(`/api/v1/content/admin/faqs/${faq.id}`)
        .send({ displayOrder: 2 })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/content/admin/faqs/:id', () => {
    it('deletes an FAQ with 204 and no body', async () => {
      const faq = await createFaq();

      const res = await request(app)
        .delete(`/api/v1/content/admin/faqs/${faq.id}`)
        .set('cookie', adminCookie)
        .expect(204);

      expect(res.body).toEqual({});
      await expect(prisma.pilotFaq.count()).resolves.toBe(0);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .delete('/api/v1/content/admin/faqs/does-not-exist')
        .set('cookie', adminCookie)
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });

    it('returns 401 without a session', async () => {
      const faq = await createFaq();

      await request(app)
        .delete(`/api/v1/content/admin/faqs/${faq.id}`)
        .expect(401);
    });

    it('returns 403 for a client session', async () => {
      const faq = await createFaq();

      await request(app)
        .delete(`/api/v1/content/admin/faqs/${faq.id}`)
        .set('cookie', clientCookie)
        .expect(403);
    });
  });
});
