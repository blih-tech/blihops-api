import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../../src/app.js';
import { prisma } from '../../../src/shared/db/prisma.js';
import { createAdminSession, createClientSession } from '../../helpers/auth.js';
import { resetDatabase } from '../../setup/resetDatabase.js';

const PUBLIC_CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=300';

type LogoItem = { id: string; imageUrl: string; alt: string };

type ListBody = {
  items: LogoItem[];
  meta: Record<string, unknown>;
};

type SingleBody = {
  data: LogoItem;
};

type ErrorBody = {
  error: { code: string; message: string; details?: unknown[] };
};

const asList = (body: unknown) => body as ListBody;
const asSingle = (body: unknown) => body as SingleBody;
const asError = (body: unknown) => body as ErrorBody;

const createLogo = (data: { imageUrl: string; alt: string }) =>
  prisma.trustedLogo.create({ data });

describe('trusted logos resource', () => {
  let adminCookie: string;
  let clientCookie: string;

  beforeAll(async () => {
    adminCookie = (await createAdminSession()).cookie;
    clientCookie = await createClientSession();
  });

  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  describe('GET /api/v1/content/logos (public)', () => {
    it('returns an empty list with empty meta without a session', async () => {
      const res = await request(app).get('/api/v1/content/logos').expect(200);

      expect(res.body).toEqual({ items: [], meta: {} });
    });

    it('returns logos in creation order', async () => {
      const first = await createLogo({
        imageUrl: 'https://example.com/first.svg',
        alt: 'First logo',
      });
      const second = await createLogo({
        imageUrl: 'https://example.com/second.svg',
        alt: 'Second logo',
      });

      const res = await request(app).get('/api/v1/content/logos').expect(200);

      expect(asList(res.body).items.map((logo) => logo.id)).toEqual([
        first.id,
        second.id,
      ]);
    });

    it('sets public cache headers', async () => {
      const res = await request(app).get('/api/v1/content/logos');

      expect(res.headers['cache-control']).toBe(PUBLIC_CACHE_CONTROL);
    });
  });

  describe('GET /api/v1/content/admin/logos', () => {
    it('returns 401 without a session', async () => {
      await request(app).get('/api/v1/content/admin/logos').expect(401);
    });

    it('returns 403 for a client session', async () => {
      await request(app)
        .get('/api/v1/content/admin/logos')
        .set('cookie', clientCookie)
        .expect(403);
    });

    it('returns all logos for an admin', async () => {
      await createLogo({
        imageUrl: 'https://example.com/logo.svg',
        alt: 'Example logo',
      });

      const res = await request(app)
        .get('/api/v1/content/admin/logos')
        .set('cookie', adminCookie)
        .expect(200);

      expect(asList(res.body).items).toHaveLength(1);
      expect(asList(res.body).items[0]).toMatchObject({
        imageUrl: 'https://example.com/logo.svg',
        alt: 'Example logo',
      });
    });
  });

  describe('POST /api/v1/content/admin/logos', () => {
    it('creates a logo and trims the alt text', async () => {
      const res = await request(app)
        .post('/api/v1/content/admin/logos')
        .set('cookie', adminCookie)
        .send({
          imageUrl: 'https://example.com/logo.svg',
          alt: '  Example logo  ',
        })
        .expect(201);

      expect(asSingle(res.body).data).toMatchObject({
        imageUrl: 'https://example.com/logo.svg',
        alt: 'Example logo',
      });
      expect(asSingle(res.body).data.id).toBeTypeOf('string');
    });

    it('returns 422 when the image URL is not a valid URL', async () => {
      const res = await request(app)
        .post('/api/v1/content/admin/logos')
        .set('cookie', adminCookie)
        .send({ imageUrl: 'not-a-url', alt: 'Example logo' })
        .expect(422);

      expect(asError(res.body).error.details).toBeDefined();
    });

    it('returns 422 when the image URL is missing', async () => {
      await request(app)
        .post('/api/v1/content/admin/logos')
        .set('cookie', adminCookie)
        .send({ alt: 'Example logo' })
        .expect(422);
    });

    it('returns 422 when the alt text is missing', async () => {
      await request(app)
        .post('/api/v1/content/admin/logos')
        .set('cookie', adminCookie)
        .send({ imageUrl: 'https://example.com/logo.svg' })
        .expect(422);
    });

    it('returns 422 when the alt text exceeds 160 characters', async () => {
      await request(app)
        .post('/api/v1/content/admin/logos')
        .set('cookie', adminCookie)
        .send({
          imageUrl: 'https://example.com/logo.svg',
          alt: 'x'.repeat(161),
        })
        .expect(422);
    });

    it('returns 401 without a session', async () => {
      await request(app)
        .post('/api/v1/content/admin/logos')
        .send({
          imageUrl: 'https://example.com/logo.svg',
          alt: 'Example logo',
        })
        .expect(401);
    });
  });

  describe('PATCH /api/v1/content/admin/logos/:id', () => {
    it('updates only the alt text', async () => {
      const logo = await createLogo({
        imageUrl: 'https://example.com/logo.svg',
        alt: 'Old alt',
      });

      const res = await request(app)
        .patch(`/api/v1/content/admin/logos/${logo.id}`)
        .set('cookie', adminCookie)
        .send({ alt: 'New alt' })
        .expect(200);

      expect(asSingle(res.body).data).toMatchObject({
        imageUrl: 'https://example.com/logo.svg',
        alt: 'New alt',
      });
    });

    it('updates only the image URL', async () => {
      const logo = await createLogo({
        imageUrl: 'https://example.com/old.svg',
        alt: 'Example logo',
      });

      const res = await request(app)
        .patch(`/api/v1/content/admin/logos/${logo.id}`)
        .set('cookie', adminCookie)
        .send({ imageUrl: 'https://example.com/new.svg' })
        .expect(200);

      expect(asSingle(res.body).data).toMatchObject({
        imageUrl: 'https://example.com/new.svg',
        alt: 'Example logo',
      });
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .patch('/api/v1/content/admin/logos/does-not-exist')
        .set('cookie', adminCookie)
        .send({ alt: 'New alt' })
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });

    it('returns 422 when no fields are provided', async () => {
      const logo = await createLogo({
        imageUrl: 'https://example.com/logo.svg',
        alt: 'Example logo',
      });

      await request(app)
        .patch(`/api/v1/content/admin/logos/${logo.id}`)
        .set('cookie', adminCookie)
        .send({})
        .expect(422);
    });

    it('returns 422 for an invalid image URL', async () => {
      const logo = await createLogo({
        imageUrl: 'https://example.com/logo.svg',
        alt: 'Example logo',
      });

      await request(app)
        .patch(`/api/v1/content/admin/logos/${logo.id}`)
        .set('cookie', adminCookie)
        .send({ imageUrl: 'not-a-url' })
        .expect(422);
    });

    it('returns 422 for an id longer than 50 characters', async () => {
      await request(app)
        .patch(`/api/v1/content/admin/logos/${'x'.repeat(51)}`)
        .set('cookie', adminCookie)
        .send({ alt: 'New alt' })
        .expect(422);
    });

    it('returns 401 without a session', async () => {
      const logo = await createLogo({
        imageUrl: 'https://example.com/logo.svg',
        alt: 'Example logo',
      });

      await request(app)
        .patch(`/api/v1/content/admin/logos/${logo.id}`)
        .send({ alt: 'New alt' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/content/admin/logos/:id', () => {
    it('deletes a logo with 204 and no body', async () => {
      const logo = await createLogo({
        imageUrl: 'https://example.com/logo.svg',
        alt: 'Example logo',
      });

      const res = await request(app)
        .delete(`/api/v1/content/admin/logos/${logo.id}`)
        .set('cookie', adminCookie)
        .expect(204);

      expect(res.body).toEqual({});
      await expect(prisma.trustedLogo.count()).resolves.toBe(0);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .delete('/api/v1/content/admin/logos/does-not-exist')
        .set('cookie', adminCookie)
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });

    it('returns 401 without a session', async () => {
      const logo = await createLogo({
        imageUrl: 'https://example.com/logo.svg',
        alt: 'Example logo',
      });

      await request(app)
        .delete(`/api/v1/content/admin/logos/${logo.id}`)
        .expect(401);
    });

    it('returns 403 for a client session', async () => {
      const logo = await createLogo({
        imageUrl: 'https://example.com/logo.svg',
        alt: 'Example logo',
      });

      await request(app)
        .delete(`/api/v1/content/admin/logos/${logo.id}`)
        .set('cookie', clientCookie)
        .expect(403);
    });
  });
});
