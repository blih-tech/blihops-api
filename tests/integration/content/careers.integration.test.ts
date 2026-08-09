import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../../src/app.js';
import { prisma } from '../../../src/shared/db/prisma.js';
import { createAdminSession, createClientSession } from '../../helpers/auth.js';
import { resetDatabase } from '../../setup/resetDatabase.js';

const PUBLIC_CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=300';

const careerData = {
  title: 'Operations Delivery Lead',
  slug: 'operations-delivery-lead',
  department: 'Operations',
  location: 'Addis Ababa, Ethiopia',
  employmentType: 'Full-time',
  summary: 'Lead a managed delivery pod.',
  overview: ['You will own the operating rhythm.'],
  responsibilities: ['Run daily delivery routines.'],
  requirements: ['Three or more years of experience.'],
};

type ListItem = {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  employmentType: string;
  summary: string;
  createdAt: string;
};

type DetailBody = {
  data: {
    id: string;
    title: string;
    slug: string;
    summary: string;
    isActive: boolean;
    overview: string[];
    responsibilities: string[];
    requirements: string[];
  };
};

type ListBody = {
  items: ListItem[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

type ErrorBody = {
  error: {
    code: string;
    message: string;
    details?: { path?: string; message: string }[];
  };
};

const asDetail = (body: unknown) => body as DetailBody;
const asList = (body: unknown) => body as ListBody;
const asError = (body: unknown) => body as ErrorBody;

const createCareer = (
  overrides: Partial<typeof careerData> & { isActive?: boolean } = {},
) =>
  prisma.careerRole.create({
    data: { ...careerData, ...overrides },
  });

describe('career roles resource', () => {
  let adminCookie: string;
  let clientCookie: string;

  beforeAll(async () => {
    adminCookie = (await createAdminSession()).cookie;
    clientCookie = await createClientSession();
  });

  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  describe('GET /api/v1/content/careers (public)', () => {
    it('returns an empty list with paginated meta', async () => {
      const res = await request(app).get('/api/v1/content/careers').expect(200);

      expect(res.body).toEqual({
        items: [],
        meta: { page: 1, pageSize: 12, total: 0, totalPages: 0 },
      });
    });

    it('returns only active career roles', async () => {
      await createCareer({ slug: 'inactive-role' });
      await createCareer({ slug: 'active-role', isActive: true });

      const res = await request(app).get('/api/v1/content/careers').expect(200);

      const items = asList(res.body).items;
      expect(items).toHaveLength(1);
      expect(items[0]?.slug).toBe('active-role');
    });

    it('returns active career roles newest first', async () => {
      const first = await createCareer({ slug: 'first', isActive: true });
      const second = await createCareer({ slug: 'second', isActive: true });

      const res = await request(app).get('/api/v1/content/careers').expect(200);

      expect(asList(res.body).items.map((item) => item.id)).toEqual([
        second.id,
        first.id,
      ]);
    });

    it('returns trimmed list items without the body arrays', async () => {
      await createCareer({ isActive: true });

      const res = await request(app).get('/api/v1/content/careers').expect(200);

      expect(asList(res.body).items[0]).not.toHaveProperty('overview');
      expect(asList(res.body).items[0]).not.toHaveProperty('isActive');
      expect(asList(res.body).items[0]).toMatchObject({
        title: careerData.title,
        department: careerData.department,
      });
    });

    it('paginates results with meta', async () => {
      for (const slug of ['one', 'two', 'three']) {
        await createCareer({ slug, isActive: true });
      }

      const res = await request(app)
        .get('/api/v1/content/careers?page=1&pageSize=2')
        .expect(200);

      const body = asList(res.body);
      expect(body.items).toHaveLength(2);
      expect(body.meta).toEqual({
        page: 1,
        pageSize: 2,
        total: 3,
        totalPages: 2,
      });
    });

    it('returns 422 for an invalid pageSize', async () => {
      await request(app)
        .get('/api/v1/content/careers?pageSize=101')
        .expect(422);
    });

    it('sets public cache headers', async () => {
      const res = await request(app).get('/api/v1/content/careers');

      expect(res.headers['cache-control']).toBe(PUBLIC_CACHE_CONTROL);
    });
  });

  describe('GET /api/v1/content/careers/:slug (public)', () => {
    it('returns an active career role with all fields', async () => {
      await createCareer({ isActive: true });

      const res = await request(app)
        .get(`/api/v1/content/careers/${careerData.slug}`)
        .expect(200);

      const data = asDetail(res.body).data;
      expect(data.isActive).toBe(true);
      expect(data.overview).toEqual(careerData.overview);
      expect(data.responsibilities).toEqual(careerData.responsibilities);
      expect(data.requirements).toEqual(careerData.requirements);
    });

    it('returns 404 for an inactive career role', async () => {
      await createCareer();

      const res = await request(app)
        .get(`/api/v1/content/careers/${careerData.slug}`)
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });

    it('returns 404 for an unknown slug', async () => {
      await request(app)
        .get('/api/v1/content/careers/does-not-exist')
        .expect(404);
    });
  });

  describe('GET /api/v1/content/admin/careers', () => {
    it('returns 401 without a session', async () => {
      await request(app).get('/api/v1/content/admin/careers').expect(401);
    });

    it('returns 403 for a client session', async () => {
      await request(app)
        .get('/api/v1/content/admin/careers')
        .set('cookie', clientCookie)
        .expect(403);
    });

    it('lists all career roles regardless of active state', async () => {
      await createCareer({ slug: 'inactive-role' });
      await createCareer({ slug: 'active-role', isActive: true });

      const res = await request(app)
        .get('/api/v1/content/admin/careers')
        .set('cookie', adminCookie)
        .expect(200);

      expect(asList(res.body).items).toHaveLength(2);
    });

    it('filters by isActive', async () => {
      await createCareer({ slug: 'inactive-role' });
      await createCareer({ slug: 'active-role', isActive: true });

      const res = await request(app)
        .get('/api/v1/content/admin/careers?isActive=false')
        .set('cookie', adminCookie)
        .expect(200);

      const items = asList(res.body).items;
      expect(items).toHaveLength(1);
      expect(items[0]?.slug).toBe('inactive-role');
    });
  });

  describe('GET /api/v1/content/admin/careers/:id', () => {
    it('returns the full detail for an admin', async () => {
      const career = await createCareer();

      const res = await request(app)
        .get(`/api/v1/content/admin/careers/${career.id}`)
        .set('cookie', adminCookie)
        .expect(200);

      expect(asDetail(res.body).data).toMatchObject({
        slug: careerData.slug,
        isActive: false,
      });
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .get('/api/v1/content/admin/careers/does-not-exist')
        .set('cookie', adminCookie)
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/v1/content/admin/careers', () => {
    it('creates an inactive career role with all required fields', async () => {
      const res = await request(app)
        .post('/api/v1/content/admin/careers')
        .set('cookie', adminCookie)
        .send(careerData)
        .expect(201);

      expect(asDetail(res.body).data).toMatchObject({
        title: careerData.title,
        isActive: false,
      });
      expect(asDetail(res.body).data.id).toBeTypeOf('string');
    });

    it('returns 422 when required fields are missing', async () => {
      const { title: _title, ...withoutTitle } = careerData;
      void _title;

      const res = await request(app)
        .post('/api/v1/content/admin/careers')
        .set('cookie', adminCookie)
        .send(withoutTitle)
        .expect(422);

      expect(asError(res.body).error.details).toBeDefined();
    });

    it('returns 422 for an invalid slug format', async () => {
      await request(app)
        .post('/api/v1/content/admin/careers')
        .set('cookie', adminCookie)
        .send({ ...careerData, slug: 'Invalid Slug!' })
        .expect(422);
    });

    it('returns 422 for an empty list field', async () => {
      await request(app)
        .post('/api/v1/content/admin/careers')
        .set('cookie', adminCookie)
        .send({ ...careerData, responsibilities: [] })
        .expect(422);
    });

    it('returns 409 for a duplicate slug', async () => {
      await createCareer();

      const res = await request(app)
        .post('/api/v1/content/admin/careers')
        .set('cookie', adminCookie)
        .send(careerData)
        .expect(409);

      expect(asError(res.body).error.code).toBe('CONFLICT');
    });

    it('returns 401 without a session', async () => {
      await request(app)
        .post('/api/v1/content/admin/careers')
        .send(careerData)
        .expect(401);
    });
  });

  describe('PATCH /api/v1/content/admin/careers/:id', () => {
    it('updates a subset of fields', async () => {
      const career = await createCareer();

      const res = await request(app)
        .patch(`/api/v1/content/admin/careers/${career.id}`)
        .set('cookie', adminCookie)
        .send({ title: 'Senior Operations Delivery Lead', summary: 'Updated.' })
        .expect(200);

      const data = asDetail(res.body).data;
      expect(data.title).toBe('Senior Operations Delivery Lead');
      expect(data.summary).toBe('Updated.');
      expect(data.slug).toBe(careerData.slug);
    });

    it('activates a career role and makes it publicly visible', async () => {
      const career = await createCareer();

      const res = await request(app)
        .patch(`/api/v1/content/admin/careers/${career.id}`)
        .set('cookie', adminCookie)
        .send({ isActive: true })
        .expect(200);

      expect(asDetail(res.body).data.isActive).toBe(true);

      await request(app)
        .get(`/api/v1/content/careers/${careerData.slug}`)
        .expect(200);
    });

    it('deactivates a career role and hides it from the public', async () => {
      const career = await createCareer({ isActive: true });

      await request(app)
        .patch(`/api/v1/content/admin/careers/${career.id}`)
        .set('cookie', adminCookie)
        .send({ isActive: false })
        .expect(200);

      await request(app)
        .get(`/api/v1/content/careers/${careerData.slug}`)
        .expect(404);
    });

    it('returns 409 when renaming to an existing slug', async () => {
      const career = await createCareer({ slug: 'first-role' });
      await createCareer({ slug: 'second-role' });

      const res = await request(app)
        .patch(`/api/v1/content/admin/careers/${career.id}`)
        .set('cookie', adminCookie)
        .send({ slug: 'second-role' })
        .expect(409);

      expect(asError(res.body).error.code).toBe('CONFLICT');
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .patch('/api/v1/content/admin/careers/does-not-exist')
        .set('cookie', adminCookie)
        .send({ title: 'New title' })
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });

    it('returns 422 for an empty body', async () => {
      const career = await createCareer();

      await request(app)
        .patch(`/api/v1/content/admin/careers/${career.id}`)
        .set('cookie', adminCookie)
        .send({})
        .expect(422);
    });

    it('returns 401 without a session', async () => {
      const career = await createCareer();

      await request(app)
        .patch(`/api/v1/content/admin/careers/${career.id}`)
        .send({ title: 'New title' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/content/admin/careers/:id', () => {
    it('deletes a career role with 204 and no body', async () => {
      const career = await createCareer();

      const res = await request(app)
        .delete(`/api/v1/content/admin/careers/${career.id}`)
        .set('cookie', adminCookie)
        .expect(204);

      expect(res.body).toEqual({});
      await expect(prisma.careerRole.count()).resolves.toBe(0);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .delete('/api/v1/content/admin/careers/does-not-exist')
        .set('cookie', adminCookie)
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });

    it('returns 401 without a session', async () => {
      const career = await createCareer();

      await request(app)
        .delete(`/api/v1/content/admin/careers/${career.id}`)
        .expect(401);
    });

    it('returns 403 for a client session', async () => {
      const career = await createCareer();

      await request(app)
        .delete(`/api/v1/content/admin/careers/${career.id}`)
        .set('cookie', clientCookie)
        .expect(403);
    });
  });
});
