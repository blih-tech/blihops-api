import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../../src/app.js';
import { prisma } from '../../../src/shared/db/prisma.js';
import { createAdminSession, createClientSession } from '../../helpers/auth.js';
import { resetDatabase } from '../../setup/resetDatabase.js';

const PUBLIC_CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=300';

type HeroItem = {
  id: string;
  videoUrl: string;
  coverUrl: string;
  altLabel: string;
  lastUpdatedAt: string;
};

type SingleBody = {
  data: HeroItem | null;
};

type ErrorBody = {
  error: { code: string; message: string; details?: unknown[] };
};

const asSingle = (body: unknown) => body as SingleBody;
const asError = (body: unknown) => body as ErrorBody;

const heroData = {
  videoUrl: 'https://example.com/hero.mp4',
  coverUrl: 'https://example.com/cover.jpg',
  altLabel: 'Services hero video',
};

const seedHero = () =>
  prisma.servicesHeroMedia.create({ data: { id: 'global', ...heroData } });

describe('services hero media resource', () => {
  let adminCookie: string;
  let clientCookie: string;

  beforeAll(async () => {
    adminCookie = (await createAdminSession()).cookie;
    clientCookie = await createClientSession();
  });

  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  describe('GET /api/v1/content/services-hero (public)', () => {
    it('returns null data when the singleton is not configured', async () => {
      const res = await request(app)
        .get('/api/v1/content/services-hero')
        .expect(200);

      expect(res.body).toEqual({ data: null });
    });

    it('returns the singleton when configured', async () => {
      await seedHero();

      const res = await request(app)
        .get('/api/v1/content/services-hero')
        .expect(200);

      const data = asSingle(res.body).data;
      expect(data).not.toBeNull();
      expect(data).toMatchObject({ id: 'global', ...heroData });
      expect(data?.lastUpdatedAt).toBeTypeOf('string');
    });

    it('sets public cache headers', async () => {
      const res = await request(app).get('/api/v1/content/services-hero');

      expect(res.headers['cache-control']).toBe(PUBLIC_CACHE_CONTROL);
    });
  });

  describe('GET /api/v1/content/admin/services-hero', () => {
    it('returns 401 without a session', async () => {
      await request(app).get('/api/v1/content/admin/services-hero').expect(401);
    });

    it('returns 403 for a client session', async () => {
      await request(app)
        .get('/api/v1/content/admin/services-hero')
        .set('cookie', clientCookie)
        .expect(403);
    });

    it('returns null data for an admin when not configured', async () => {
      const res = await request(app)
        .get('/api/v1/content/admin/services-hero')
        .set('cookie', adminCookie)
        .expect(200);

      expect(asSingle(res.body).data).toBeNull();
    });

    it('returns the singleton for an admin when configured', async () => {
      await seedHero();

      const res = await request(app)
        .get('/api/v1/content/admin/services-hero')
        .set('cookie', adminCookie)
        .expect(200);

      expect(asSingle(res.body).data).toMatchObject(heroData);
    });
  });

  describe('PUT /api/v1/content/admin/services-hero', () => {
    it('creates the singleton on first save', async () => {
      const res = await request(app)
        .put('/api/v1/content/admin/services-hero')
        .set('cookie', adminCookie)
        .send(heroData)
        .expect(200);

      expect(asSingle(res.body).data).toMatchObject({
        id: 'global',
        ...heroData,
      });
      await expect(prisma.servicesHeroMedia.count()).resolves.toBe(1);
    });

    it('replaces the singleton on subsequent saves', async () => {
      await seedHero();

      const res = await request(app)
        .put('/api/v1/content/admin/services-hero')
        .set('cookie', adminCookie)
        .send({
          videoUrl: 'https://example.com/new.mp4',
          coverUrl: 'https://example.com/new-cover.jpg',
          altLabel: 'New hero video',
        })
        .expect(200);

      expect(asSingle(res.body).data).toMatchObject({
        videoUrl: 'https://example.com/new.mp4',
        coverUrl: 'https://example.com/new-cover.jpg',
        altLabel: 'New hero video',
      });
      await expect(prisma.servicesHeroMedia.count()).resolves.toBe(1);
    });

    it('returns 422 when the video URL is missing', async () => {
      await request(app)
        .put('/api/v1/content/admin/services-hero')
        .set('cookie', adminCookie)
        .send({ coverUrl: heroData.coverUrl, altLabel: heroData.altLabel })
        .expect(422);
    });

    it('returns 422 when the cover URL is invalid', async () => {
      const res = await request(app)
        .put('/api/v1/content/admin/services-hero')
        .set('cookie', adminCookie)
        .send({ ...heroData, coverUrl: 'not-a-url' })
        .expect(422);

      expect(asError(res.body).error.details).toBeDefined();
    });

    it('returns 422 when the alt label is missing', async () => {
      await request(app)
        .put('/api/v1/content/admin/services-hero')
        .set('cookie', adminCookie)
        .send({ videoUrl: heroData.videoUrl, coverUrl: heroData.coverUrl })
        .expect(422);
    });

    it('returns 401 without a session', async () => {
      await request(app)
        .put('/api/v1/content/admin/services-hero')
        .send(heroData)
        .expect(401);
    });

    it('returns 403 for a client session', async () => {
      await request(app)
        .put('/api/v1/content/admin/services-hero')
        .set('cookie', clientCookie)
        .send(heroData)
        .expect(403);
    });
  });
});
