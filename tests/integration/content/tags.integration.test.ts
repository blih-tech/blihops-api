import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../../src/app.js';
import { prisma } from '../../../src/shared/db/prisma.js';
import { createAdminSession, createClientSession } from '../../helpers/auth.js';
import { resetDatabase } from '../../setup/resetDatabase.js';

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

const PUBLIC_CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=300';

describe('tags resource', () => {
  let adminCookie: string;
  let clientCookie: string;

  beforeAll(async () => {
    adminCookie = (await createAdminSession()).cookie;
    clientCookie = await createClientSession();
  });

  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  describe('GET /api/v1/content/tags (public)', () => {
    it('returns an empty list with empty meta without a session', async () => {
      const res = await request(app).get('/api/v1/content/tags').expect(200);

      expect(res.body).toEqual({ items: [], meta: {} });
    });

    it('returns tags sorted case-insensitively by name', async () => {
      for (const name of ['Beta', 'alpha', 'Gamma']) {
        await prisma.tag.create({ data: { name } });
      }

      const res = await request(app).get('/api/v1/content/tags').expect(200);

      expect(asList(res.body).items.map((tag) => tag.name)).toEqual([
        'alpha',
        'Beta',
        'Gamma',
      ]);
    });

    it('sets public cache headers', async () => {
      const res = await request(app).get('/api/v1/content/tags');

      expect(res.headers['cache-control']).toBe(PUBLIC_CACHE_CONTROL);
    });
  });

  describe('GET /api/v1/content/admin/tags', () => {
    it('returns 401 without a session', async () => {
      await request(app).get('/api/v1/content/admin/tags').expect(401);
    });

    it('returns 403 for a client session', async () => {
      await request(app)
        .get('/api/v1/content/admin/tags')
        .set('cookie', clientCookie)
        .expect(403);
    });

    it('returns all tags for an admin', async () => {
      await prisma.tag.create({ data: { name: 'React' } });

      const res = await request(app)
        .get('/api/v1/content/admin/tags')
        .set('cookie', adminCookie)
        .expect(200);

      expect(asList(res.body).items).toHaveLength(1);
      expect(asList(res.body).items[0]).toMatchObject({ name: 'React' });
    });
  });

  describe('POST /api/v1/content/admin/tags', () => {
    it('creates a tag and trims the name', async () => {
      const res = await request(app)
        .post('/api/v1/content/admin/tags')
        .set('cookie', adminCookie)
        .send({ name: '  React  ' })
        .expect(201);

      expect(asSingle(res.body).data.name).toBe('React');
      expect(asSingle(res.body).data.id).toBeTypeOf('string');
    });

    it('returns 409 for a duplicate name', async () => {
      await prisma.tag.create({ data: { name: 'React' } });

      const res = await request(app)
        .post('/api/v1/content/admin/tags')
        .set('cookie', adminCookie)
        .send({ name: 'React' })
        .expect(409);

      expect(asError(res.body).error.code).toBe('CONFLICT');
    });

    it('returns 422 when the name is missing', async () => {
      await request(app)
        .post('/api/v1/content/admin/tags')
        .set('cookie', adminCookie)
        .send({})
        .expect(422);
    });

    it('returns 422 when the name is empty', async () => {
      const res = await request(app)
        .post('/api/v1/content/admin/tags')
        .set('cookie', adminCookie)
        .send({ name: '' })
        .expect(422);

      expect(asError(res.body).error.details).toBeDefined();
    });

    it('returns 422 when the name exceeds 100 characters', async () => {
      await request(app)
        .post('/api/v1/content/admin/tags')
        .set('cookie', adminCookie)
        .send({ name: 'x'.repeat(101) })
        .expect(422);
    });

    it('returns 401 without a session', async () => {
      await request(app)
        .post('/api/v1/content/admin/tags')
        .send({ name: 'React' })
        .expect(401);
    });
  });

  describe('PATCH /api/v1/content/admin/tags/:id', () => {
    it('renames a tag', async () => {
      const tag = await prisma.tag.create({ data: { name: 'React' } });

      const res = await request(app)
        .patch(`/api/v1/content/admin/tags/${tag.id}`)
        .set('cookie', adminCookie)
        .send({ name: 'React.js' })
        .expect(200);

      expect(asSingle(res.body).data.name).toBe('React.js');
    });

    it('allows renaming a tag to its own name', async () => {
      const tag = await prisma.tag.create({ data: { name: 'React' } });

      await request(app)
        .patch(`/api/v1/content/admin/tags/${tag.id}`)
        .set('cookie', adminCookie)
        .send({ name: 'React' })
        .expect(200);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .patch('/api/v1/content/admin/tags/does-not-exist')
        .set('cookie', adminCookie)
        .send({ name: 'React' })
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });

    it('returns 409 when renaming to an existing tag name', async () => {
      const tag = await prisma.tag.create({ data: { name: 'React' } });
      await prisma.tag.create({ data: { name: 'Vue' } });

      const res = await request(app)
        .patch(`/api/v1/content/admin/tags/${tag.id}`)
        .set('cookie', adminCookie)
        .send({ name: 'Vue' })
        .expect(409);

      expect(asError(res.body).error.code).toBe('CONFLICT');
    });

    it('returns 422 for an id longer than 50 characters', async () => {
      await request(app)
        .patch(`/api/v1/content/admin/tags/${'x'.repeat(51)}`)
        .set('cookie', adminCookie)
        .send({ name: 'React' })
        .expect(422);
    });

    it('returns 422 for an empty name', async () => {
      const tag = await prisma.tag.create({ data: { name: 'React' } });

      await request(app)
        .patch(`/api/v1/content/admin/tags/${tag.id}`)
        .set('cookie', adminCookie)
        .send({ name: '' })
        .expect(422);
    });

    it('returns 401 without a session', async () => {
      const tag = await prisma.tag.create({ data: { name: 'React' } });

      await request(app)
        .patch(`/api/v1/content/admin/tags/${tag.id}`)
        .send({ name: 'Vue' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/content/admin/tags/:id', () => {
    it('deletes a tag with 204 and no body', async () => {
      const tag = await prisma.tag.create({ data: { name: 'React' } });

      const res = await request(app)
        .delete(`/api/v1/content/admin/tags/${tag.id}`)
        .set('cookie', adminCookie)
        .expect(204);

      expect(res.body).toEqual({});
      await expect(prisma.tag.count()).resolves.toBe(0);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .delete('/api/v1/content/admin/tags/does-not-exist')
        .set('cookie', adminCookie)
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });

    it('returns 401 without a session', async () => {
      const tag = await prisma.tag.create({ data: { name: 'React' } });

      await request(app)
        .delete(`/api/v1/content/admin/tags/${tag.id}`)
        .expect(401);
    });

    it('returns 403 for a client session', async () => {
      const tag = await prisma.tag.create({ data: { name: 'React' } });

      await request(app)
        .delete(`/api/v1/content/admin/tags/${tag.id}`)
        .set('cookie', clientCookie)
        .expect(403);
    });
  });
});
