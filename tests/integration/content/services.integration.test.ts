import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../../src/app.js';
import { prisma } from '../../../src/shared/db/prisma.js';
import { createAdminSession, createClientSession } from '../../helpers/auth.js';
import { resetDatabase } from '../../setup/resetDatabase.js';

const PUBLIC_CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=300';

const serviceData = {
  icon: 'headset',
  imageUrl: 'https://example.com/services/customer.jpg',
  alt: 'Customer support team at work',
  displayOrder: 1,
  content: {
    en: {
      slug: 'customer-support',
      title: 'Customer Support',
      subtitle: 'Support that scales without the chaos',
      shortDescription:
        'Omnichannel support across email, chat, and voice with response-time SLAs.',
      details: 'Trained agents, quality scoring, and clear ownership.',
      tag: 'SUPPORT THAT SCALES',
      body: 'Email, chat, and voice with trained agents and clear response SLAs.',
      features: ['Omnichannel: email, chat, voice', 'Response-time SLAs'],
      whoThisIsFor:
        'SaaS and ecommerce teams that want better support without growing headcount.',
    },
    de: {
      slug: 'kundenservice',
      title: 'Kundenservice',
      subtitle: 'Support, der skaliert ohne Chaos',
      shortDescription:
        'Omnichannel-Support über E-Mail, Chat und Telefon mit Reaktions-SLAs.',
      details: 'Geschulte Agenten, Qualitätsmessung und klare Verantwortung.',
      tag: 'SUPPORT, DER SKALIERT',
      body: 'E-Mail, Chat und Telefon mit geschulten Agenten und klaren SLAs.',
      features: ['Omnichannel: E-Mail, Chat, Telefon', 'Reaktions-SLAs'],
      whoThisIsFor:
        'SaaS- und E-Commerce-Teams, die besseren Support ohne Personalaufbau wollen.',
    },
  },
};

type ServiceItem = {
  id: string;
  icon: string;
  imageUrl: string;
  alt: string;
  displayOrder: number;
  content: {
    en: {
      slug: string;
      title: string;
      subtitle: string;
      shortDescription: string;
      details: string;
      tag: string;
      body: string;
      features: string[];
      whoThisIsFor: string;
    };
    de: typeof serviceData.content.en;
  };
};

type ListBody = {
  items: ServiceItem[];
  meta: Record<string, unknown>;
};

type SingleBody = {
  data: ServiceItem;
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

const createService = (overrides: Partial<typeof serviceData> = {}) =>
  prisma.service.create({
    data: {
      icon: overrides.icon ?? serviceData.icon,
      imageUrl: overrides.imageUrl ?? serviceData.imageUrl,
      alt: overrides.alt ?? serviceData.alt,
      displayOrder: overrides.displayOrder ?? serviceData.displayOrder,
      content: overrides.content ?? serviceData.content,
    },
  });

describe('services resource', () => {
  let adminCookie: string;
  let clientCookie: string;

  beforeAll(async () => {
    adminCookie = (await createAdminSession()).cookie;
    clientCookie = await createClientSession();
  });

  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  describe('GET /api/v1/content/services (public)', () => {
    it('returns an empty list with empty meta', async () => {
      const res = await request(app)
        .get('/api/v1/content/services')
        .expect(200);

      expect(res.body).toEqual({ items: [], meta: {} });
    });

    it('returns all services in display order (no status filter)', async () => {
      await createService({ displayOrder: 2 });
      await createService({ displayOrder: 1 });

      const res = await request(app)
        .get('/api/v1/content/services')
        .expect(200);

      const items = asList(res.body).items;
      expect(items).toHaveLength(2);
      expect(items.map((item) => item.displayOrder)).toEqual([1, 2]);
    });

    it('returns both locales for each service', async () => {
      await createService();

      const res = await request(app)
        .get('/api/v1/content/services')
        .expect(200);

      const item = asList(res.body).items[0];
      expect(item?.content.en.slug).toBe('customer-support');
      expect(item?.content.de.slug).toBe('kundenservice');
      expect(item?.content.en.title).toBe('Customer Support');
      expect(item?.content.de.title).toBe('Kundenservice');
    });

    it('sets public cache headers', async () => {
      const res = await request(app).get('/api/v1/content/services');

      expect(res.headers['cache-control']).toBe(PUBLIC_CACHE_CONTROL);
    });
  });

  describe('GET /api/v1/content/admin/services', () => {
    it('returns 401 without a session', async () => {
      await request(app).get('/api/v1/content/admin/services').expect(401);
    });

    it('returns 403 for a client session', async () => {
      await request(app)
        .get('/api/v1/content/admin/services')
        .set('cookie', clientCookie)
        .expect(403);
    });

    it('returns all services in display order', async () => {
      await createService({ displayOrder: 2 });
      await createService({ displayOrder: 1 });

      const res = await request(app)
        .get('/api/v1/content/admin/services')
        .set('cookie', adminCookie)
        .expect(200);

      const items = asList(res.body).items;
      expect(items).toHaveLength(2);
      expect(items.map((item) => item.displayOrder)).toEqual([1, 2]);
    });
  });

  describe('GET /api/v1/content/admin/services/:id', () => {
    it('returns the service for an admin', async () => {
      const service = await createService();

      const res = await request(app)
        .get(`/api/v1/content/admin/services/${service.id}`)
        .set('cookie', adminCookie)
        .expect(200);

      expect(asSingle(res.body).data).toMatchObject({
        icon: 'headset',
        displayOrder: 1,
      });
      expect(asSingle(res.body).data.content.en.slug).toBe('customer-support');
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .get('/api/v1/content/admin/services/does-not-exist')
        .set('cookie', adminCookie)
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/v1/content/admin/services', () => {
    it('creates a service that is immediately public', async () => {
      const res = await request(app)
        .post('/api/v1/content/admin/services')
        .set('cookie', adminCookie)
        .send(serviceData)
        .expect(201);

      const data = asSingle(res.body).data;
      expect(data.id).toBeTypeOf('string');
      expect(data.content.en.slug).toBe('customer-support');

      const publicRes = await request(app)
        .get('/api/v1/content/services')
        .expect(200);
      expect(asList(publicRes.body).items).toHaveLength(1);
    });

    it('defaults displayOrder to the end of the list when omitted', async () => {
      const { displayOrder: _displayOrder, ...withoutOrder } = serviceData;
      void _displayOrder;

      const first = await request(app)
        .post('/api/v1/content/admin/services')
        .set('cookie', adminCookie)
        .send(withoutOrder)
        .expect(201);
      expect(asSingle(first.body).data.displayOrder).toBe(0);

      const second = await request(app)
        .post('/api/v1/content/admin/services')
        .set('cookie', adminCookie)
        .send({
          ...withoutOrder,
          content: {
            en: { ...withoutOrder.content.en, slug: 'back-office' },
            de: { ...withoutOrder.content.de, slug: 'backoffice' },
          },
        })
        .expect(201);
      expect(asSingle(second.body).data.displayOrder).toBe(1);
    });

    it('returns 422 when a locale is missing', async () => {
      const { content, ...rest } = serviceData;
      const res = await request(app)
        .post('/api/v1/content/admin/services')
        .set('cookie', adminCookie)
        .send({ ...rest, content: { en: content.en } })
        .expect(422);

      expect(asError(res.body).error.details).toBeDefined();
    });

    it('returns 422 when a locale field is empty', async () => {
      await request(app)
        .post('/api/v1/content/admin/services')
        .set('cookie', adminCookie)
        .send({
          ...serviceData,
          content: {
            en: serviceData.content.en,
            de: { ...serviceData.content.de, title: '' },
          },
        })
        .expect(422);
    });

    it('returns 422 for an icon outside the whitelist', async () => {
      const res = await request(app)
        .post('/api/v1/content/admin/services')
        .set('cookie', adminCookie)
        .send({ ...serviceData, icon: 'rocket' })
        .expect(422);

      const details = asError(res.body).error.details ?? [];
      expect(details.map((detail) => detail.path)).toContain('icon');
    });

    it('returns 422 for an invalid slug format', async () => {
      await request(app)
        .post('/api/v1/content/admin/services')
        .set('cookie', adminCookie)
        .send({
          ...serviceData,
          content: {
            en: { ...serviceData.content.en, slug: 'Customer Support' },
            de: serviceData.content.de,
          },
        })
        .expect(422);
    });

    it('returns 422 for a negative display order', async () => {
      await request(app)
        .post('/api/v1/content/admin/services')
        .set('cookie', adminCookie)
        .send({ ...serviceData, displayOrder: -1 })
        .expect(422);
    });

    it('returns 409 when the en slug is already in use', async () => {
      await createService();

      const res = await request(app)
        .post('/api/v1/content/admin/services')
        .set('cookie', adminCookie)
        .send({
          ...serviceData,
          content: {
            en: { ...serviceData.content.en, slug: 'customer-support' },
            de: { ...serviceData.content.de, slug: 'anderer-slug' },
          },
        })
        .expect(409);

      expect(asError(res.body).error.code).toBe('CONTENT_SLUG_TAKEN');
    });

    it('returns 409 when the de slug collides with another service en slug', async () => {
      await createService();

      const res = await request(app)
        .post('/api/v1/content/admin/services')
        .set('cookie', adminCookie)
        .send({
          ...serviceData,
          content: {
            en: { ...serviceData.content.en, slug: 'back-office' },
            de: { ...serviceData.content.de, slug: 'customer-support' },
          },
        })
        .expect(409);

      expect(asError(res.body).error.code).toBe('CONTENT_SLUG_TAKEN');
    });

    it('returns 401 without a session', async () => {
      await request(app)
        .post('/api/v1/content/admin/services')
        .send(serviceData)
        .expect(401);
    });
  });

  describe('PATCH /api/v1/content/admin/services/:id', () => {
    it('updates one locale without touching the other', async () => {
      const service = await createService();

      const res = await request(app)
        .patch(`/api/v1/content/admin/services/${service.id}`)
        .set('cookie', adminCookie)
        .send({
          locale: 'en',
          content: {
            ...serviceData.content.en,
            title: 'Customer Support (updated)',
          },
        })
        .expect(200);

      const data = asSingle(res.body).data;
      expect(data.content.en.title).toBe('Customer Support (updated)');
      expect(data.content.de.title).toBe('Kundenservice');
    });

    it('updates shared fields and reorders', async () => {
      const service = await createService();

      const res = await request(app)
        .patch(`/api/v1/content/admin/services/${service.id}`)
        .set('cookie', adminCookie)
        .send({ icon: 'sparkles', displayOrder: 9 })
        .expect(200);

      expect(asSingle(res.body).data).toMatchObject({
        icon: 'sparkles',
        displayOrder: 9,
      });
    });

    it('returns 422 when locale is provided without content', async () => {
      const service = await createService();

      const res = await request(app)
        .patch(`/api/v1/content/admin/services/${service.id}`)
        .set('cookie', adminCookie)
        .send({ locale: 'en' })
        .expect(422);

      expect(asError(res.body).error.details).toBeDefined();
    });

    it('returns 422 when content is provided without locale', async () => {
      const service = await createService();

      const res = await request(app)
        .patch(`/api/v1/content/admin/services/${service.id}`)
        .set('cookie', adminCookie)
        .send({ content: serviceData.content.en })
        .expect(422);

      expect(asError(res.body).error.details).toBeDefined();
    });

    it('returns 422 for an empty body', async () => {
      const service = await createService();

      await request(app)
        .patch(`/api/v1/content/admin/services/${service.id}`)
        .set('cookie', adminCookie)
        .send({})
        .expect(422);
    });

    it('returns 422 when the patched locale payload itself is invalid', async () => {
      const service = await createService();

      const res = await request(app)
        .patch(`/api/v1/content/admin/services/${service.id}`)
        .set('cookie', adminCookie)
        .send({
          locale: 'de',
          content: {
            ...serviceData.content.de,
            title: ' ',
            features: [],
          },
        })
        .expect(422);

      const error = asError(res.body).error;
      expect(error.code).toBe('VALIDATION_ERROR');
      const details = error.details ?? [];
      expect(details.map((detail) => detail.path)).toContain('content.title');
      expect(details.map((detail) => detail.path)).toContain(
        'content.features',
      );
    });

    it('returns 422 CONTENT_INCOMPLETE when the merged record is incomplete', async () => {
      const service = await createService();
      // Simulate a corrupted/partial de locale in the database
      await prisma.service.update({
        where: { id: service.id },
        data: {
          content: {
            en: serviceData.content.en,
            de: { slug: 'kundenservice', title: 'Kundenservice' },
          },
        },
      });

      const res = await request(app)
        .patch(`/api/v1/content/admin/services/${service.id}`)
        .set('cookie', adminCookie)
        .send({ icon: 'files' })
        .expect(422);

      const error = asError(res.body).error;
      expect(error.code).toBe('CONTENT_INCOMPLETE');
      const details = error.details ?? [];
      expect(details.map((detail) => detail.path)).toContain('de.subtitle');
      expect(details.map((detail) => detail.path)).toContain('de.body');
    });

    it('returns 409 when the new en slug is already in use', async () => {
      const service = await createService();
      await prisma.service.create({
        data: {
          ...serviceData,
          displayOrder: 2,
          content: {
            en: { ...serviceData.content.en, slug: 'back-office' },
            de: { ...serviceData.content.de, slug: 'backoffice' },
          },
        },
      });

      const res = await request(app)
        .patch(`/api/v1/content/admin/services/${service.id}`)
        .set('cookie', adminCookie)
        .send({
          locale: 'en',
          content: { ...serviceData.content.en, slug: 'back-office' },
        })
        .expect(409);

      expect(asError(res.body).error.code).toBe('CONTENT_SLUG_TAKEN');
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .patch('/api/v1/content/admin/services/does-not-exist')
        .set('cookie', adminCookie)
        .send({ icon: 'files' })
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });

    it('returns 401 without a session', async () => {
      const service = await createService();

      await request(app)
        .patch(`/api/v1/content/admin/services/${service.id}`)
        .send({ icon: 'files' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/content/admin/services/:id', () => {
    it('deletes a service with 204 and no body', async () => {
      const service = await createService();

      const res = await request(app)
        .delete(`/api/v1/content/admin/services/${service.id}`)
        .set('cookie', adminCookie)
        .expect(204);

      expect(res.body).toEqual({});
      await expect(prisma.service.count()).resolves.toBe(0);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .delete('/api/v1/content/admin/services/does-not-exist')
        .set('cookie', adminCookie)
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });

    it('returns 401 without a session', async () => {
      const service = await createService();

      await request(app)
        .delete(`/api/v1/content/admin/services/${service.id}`)
        .expect(401);
    });

    it('returns 403 for a client session', async () => {
      const service = await createService();

      await request(app)
        .delete(`/api/v1/content/admin/services/${service.id}`)
        .set('cookie', clientCookie)
        .expect(403);
    });
  });
});
