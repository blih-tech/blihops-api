import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../../src/app.js';
import { prisma } from '../../../src/shared/db/prisma.js';
import { createAdminSession, createClientSession } from '../../helpers/auth.js';
import { resetDatabase } from '../../setup/resetDatabase.js';

const PUBLIC_CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=300';

type ListBody = {
  items: { id: string; name: string }[];
  meta: Record<string, unknown>;
};

type SingleBody = {
  data: { id: string; name: string };
};

type ErrorBody = {
  error: { code: string; message: string; details?: unknown[] };
};

const asList = (body: unknown) => body as ListBody;
const asSingle = (body: unknown) => body as SingleBody;
const asError = (body: unknown) => body as ErrorBody;

describe('categories resource', () => {
  let adminCookie: string;
  let clientCookie: string;

  beforeAll(async () => {
    adminCookie = (await createAdminSession()).cookie;
    clientCookie = await createClientSession();
  });

  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  describe('GET /api/v1/content/categories (public)', () => {
    it('returns an empty list with empty meta without a session', async () => {
      const res = await request(app)
        .get('/api/v1/content/categories')
        .expect(200);

      expect(res.body).toEqual({ items: [], meta: {} });
    });

    it('returns categories sorted case-insensitively by name', async () => {
      for (const name of [
        'Customer Support',
        'ai & automation',
        'Operations',
      ]) {
        await prisma.category.create({ data: { name } });
      }

      const res = await request(app)
        .get('/api/v1/content/categories')
        .expect(200);

      expect(asList(res.body).items.map((category) => category.name)).toEqual([
        'ai & automation',
        'Customer Support',
        'Operations',
      ]);
    });

    it('sets public cache headers', async () => {
      const res = await request(app).get('/api/v1/content/categories');

      expect(res.headers['cache-control']).toBe(PUBLIC_CACHE_CONTROL);
    });
  });

  describe('GET /api/v1/content/admin/categories', () => {
    it('returns 401 without a session', async () => {
      await request(app).get('/api/v1/content/admin/categories').expect(401);
    });

    it('returns 403 for a client session', async () => {
      await request(app)
        .get('/api/v1/content/admin/categories')
        .set('cookie', clientCookie)
        .expect(403);
    });

    it('returns all categories for an admin', async () => {
      await prisma.category.create({ data: { name: 'Customer Support' } });

      const res = await request(app)
        .get('/api/v1/content/admin/categories')
        .set('cookie', adminCookie)
        .expect(200);

      expect(asList(res.body).items).toHaveLength(1);
      expect(asList(res.body).items[0]).toMatchObject({
        name: 'Customer Support',
      });
    });
  });

  describe('POST /api/v1/content/admin/categories', () => {
    it('creates a category and trims the name', async () => {
      const res = await request(app)
        .post('/api/v1/content/admin/categories')
        .set('cookie', adminCookie)
        .send({ name: '  Operations  ' })
        .expect(201);

      expect(asSingle(res.body).data.name).toBe('Operations');
      expect(asSingle(res.body).data.id).toBeTypeOf('string');
    });

    it('returns 409 for a duplicate name', async () => {
      await prisma.category.create({ data: { name: 'Operations' } });

      const res = await request(app)
        .post('/api/v1/content/admin/categories')
        .set('cookie', adminCookie)
        .send({ name: 'Operations' })
        .expect(409);

      expect(asError(res.body).error.code).toBe('CONFLICT');
    });

    it('returns 422 when the name is missing', async () => {
      await request(app)
        .post('/api/v1/content/admin/categories')
        .set('cookie', adminCookie)
        .send({})
        .expect(422);
    });

    it('returns 422 when the name is empty', async () => {
      const res = await request(app)
        .post('/api/v1/content/admin/categories')
        .set('cookie', adminCookie)
        .send({ name: '' })
        .expect(422);

      expect(asError(res.body).error.details).toBeDefined();
    });

    it('returns 422 when the name exceeds 100 characters', async () => {
      await request(app)
        .post('/api/v1/content/admin/categories')
        .set('cookie', adminCookie)
        .send({ name: 'x'.repeat(101) })
        .expect(422);
    });

    it('returns 401 without a session', async () => {
      await request(app)
        .post('/api/v1/content/admin/categories')
        .send({ name: 'Operations' })
        .expect(401);
    });
  });

  describe('PATCH /api/v1/content/admin/categories/:id', () => {
    it('renames a category', async () => {
      const category = await prisma.category.create({
        data: { name: 'Operations' },
      });

      const res = await request(app)
        .patch(`/api/v1/content/admin/categories/${category.id}`)
        .set('cookie', adminCookie)
        .send({ name: 'Operations Design' })
        .expect(200);

      expect(asSingle(res.body).data.name).toBe('Operations Design');
    });

    it('allows renaming a category to its own name', async () => {
      const category = await prisma.category.create({
        data: { name: 'Operations' },
      });

      await request(app)
        .patch(`/api/v1/content/admin/categories/${category.id}`)
        .set('cookie', adminCookie)
        .send({ name: 'Operations' })
        .expect(200);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .patch('/api/v1/content/admin/categories/does-not-exist')
        .set('cookie', adminCookie)
        .send({ name: 'Operations' })
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });

    it('returns 409 when renaming to an existing category name', async () => {
      const category = await prisma.category.create({
        data: { name: 'Operations' },
      });
      await prisma.category.create({ data: { name: 'AI & Automation' } });

      const res = await request(app)
        .patch(`/api/v1/content/admin/categories/${category.id}`)
        .set('cookie', adminCookie)
        .send({ name: 'AI & Automation' })
        .expect(409);

      expect(asError(res.body).error.code).toBe('CONFLICT');
    });

    it('returns 422 for an id longer than 50 characters', async () => {
      await request(app)
        .patch(`/api/v1/content/admin/categories/${'x'.repeat(51)}`)
        .set('cookie', adminCookie)
        .send({ name: 'Operations' })
        .expect(422);
    });

    it('returns 422 for an empty name', async () => {
      const category = await prisma.category.create({
        data: { name: 'Operations' },
      });

      await request(app)
        .patch(`/api/v1/content/admin/categories/${category.id}`)
        .set('cookie', adminCookie)
        .send({ name: '' })
        .expect(422);
    });

    it('returns 401 without a session', async () => {
      const category = await prisma.category.create({
        data: { name: 'Operations' },
      });

      await request(app)
        .patch(`/api/v1/content/admin/categories/${category.id}`)
        .send({ name: 'AI & Automation' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/content/admin/categories/:id', () => {
    it('deletes a category with 204 and no body', async () => {
      const category = await prisma.category.create({
        data: { name: 'Operations' },
      });

      const res = await request(app)
        .delete(`/api/v1/content/admin/categories/${category.id}`)
        .set('cookie', adminCookie)
        .expect(204);

      expect(res.body).toEqual({});
      await expect(prisma.category.count()).resolves.toBe(0);
    });

    it('returns 409 when the category is in use by a case study', async () => {
      const category = await prisma.category.create({
        data: { name: 'Operations' },
      });
      await prisma.caseStudy.create({
        data: {
          client: 'Acme',
          categoryId: category.id,
          media: { type: 'image', url: 'https://example.com/hero.jpg' },
          content: { en: { title: 'Test', slug: 'test', summary: 'Test' } },
        },
      });

      const res = await request(app)
        .delete(`/api/v1/content/admin/categories/${category.id}`)
        .set('cookie', adminCookie)
        .expect(409);

      expect(asError(res.body).error.code).toBe('CONFLICT');
      await expect(prisma.category.count()).resolves.toBe(1);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .delete('/api/v1/content/admin/categories/does-not-exist')
        .set('cookie', adminCookie)
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });

    it('returns 401 without a session', async () => {
      const category = await prisma.category.create({
        data: { name: 'Operations' },
      });

      await request(app)
        .delete(`/api/v1/content/admin/categories/${category.id}`)
        .expect(401);
    });

    it('returns 403 for a client session', async () => {
      const category = await prisma.category.create({
        data: { name: 'Operations' },
      });

      await request(app)
        .delete(`/api/v1/content/admin/categories/${category.id}`)
        .set('cookie', clientCookie)
        .expect(403);
    });
  });
});
