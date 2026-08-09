import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../../src/app.js';
import { prisma } from '../../../src/shared/db/prisma.js';
import { createAdminSession, createClientSession } from '../../helpers/auth.js';
import { resetDatabase } from '../../setup/resetDatabase.js';

const PUBLIC_CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=300';

const completeContent = (slug: string) => ({
  en: {
    title: `Title EN (${slug})`,
    slug: `${slug}-en`,
    excerpt: `Excerpt EN (${slug})`,
    body: [
      { section: 'Start with a decision', content: '<p>Section one</p>' },
      { section: 'Define the boundary', content: '<p>Section two</p>' },
    ],
  },
  de: {
    title: `Title DE (${slug})`,
    slug: `${slug}-de`,
    excerpt: `Excerpt DE (${slug})`,
    body: [
      { section: 'Mit einer Entscheidung beginnen', content: '<p>Text</p>' },
      { section: 'Die Grenze definieren', content: '<p>Text</p>' },
    ],
  },
});

const completeMedia = { type: 'image', url: 'https://example.com/hero.jpg' };

type ListItem = {
  id: string;
  slugs: { en: string; de: string };
  titles: { en: string; de: string };
  author: string;
  createdAt: string;
};

type DetailBody = {
  data: {
    id: string;
    author: string;
    readTimeMinutes: number;
    status: 'DRAFT' | 'PUBLISHED';
    content: {
      en?: { title: string; slug: string; excerpt: string; body: unknown[] };
      de?: { title: string; slug: string; excerpt: string; body: unknown[] };
    };
    tags: { id: string; name: string }[];
    category: { id: string; name: string } | null;
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

describe('insights resource', () => {
  let adminCookie: string;
  let clientCookie: string;

  beforeAll(async () => {
    adminCookie = (await createAdminSession()).cookie;
    clientCookie = await createClientSession();
  });

  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  const seedCategory = (name?: string) =>
    prisma.category.create({
      data: { name: name ?? `Category-${randomUUID().slice(0, 8)}` },
    });

  const seedTag = () =>
    prisma.tag.create({ data: { name: 'AI & Automation' } });

  const createInsight = async (
    overrides: {
      slug?: string;
      status?: 'DRAFT' | 'PUBLISHED';
      categoryId?: string | null;
      readTimeMinutes?: number;
      content?: unknown;
    } = {},
  ) => {
    const category = await seedCategory();
    const slug = overrides.slug ?? 'my-slug';
    return prisma.insight.create({
      data: {
        author: 'Blih Ops Editorial',
        categoryId: overrides.categoryId ?? category.id,
        readTimeMinutes: overrides.readTimeMinutes ?? 0,
        media: completeMedia,
        status: overrides.status ?? 'DRAFT',
        content: overrides.content ?? completeContent(slug),
      },
    });
  };

  const publishViaApi = (id: string) =>
    request(app)
      .post(`/api/v1/content/admin/insights/${id}/publish`)
      .set('cookie', adminCookie);

  describe('GET /api/v1/content/insights (public)', () => {
    it('returns an empty list with paginated meta', async () => {
      const res = await request(app)
        .get('/api/v1/content/insights')
        .expect(200);

      expect(res.body).toEqual({
        items: [],
        meta: { page: 1, pageSize: 12, total: 0, totalPages: 0 },
      });
    });

    it('returns only published insights', async () => {
      await createInsight({ slug: 'draft-one' });
      await createInsight({ slug: 'published-one', status: 'PUBLISHED' });

      const res = await request(app)
        .get('/api/v1/content/insights')
        .expect(200);

      const items = asList(res.body).items;
      expect(items).toHaveLength(1);
      expect(items[0]?.slugs.en).toBe('published-one-en');
    });

    it('returns published insights newest first', async () => {
      const first = await createInsight({ slug: 'first', status: 'PUBLISHED' });
      const second = await createInsight({
        slug: 'second',
        status: 'PUBLISHED',
      });

      const res = await request(app)
        .get('/api/v1/content/insights')
        .expect(200);

      expect(asList(res.body).items.map((item) => item.id)).toEqual([
        second.id,
        first.id,
      ]);
    });

    it('paginates results with meta', async () => {
      for (const slug of ['one', 'two', 'three']) {
        await createInsight({ slug, status: 'PUBLISHED' });
      }

      const res = await request(app)
        .get('/api/v1/content/insights?page=1&pageSize=2')
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
        .get('/api/v1/content/insights?pageSize=101')
        .expect(422);
    });

    it('sets public cache headers', async () => {
      const res = await request(app).get('/api/v1/content/insights');

      expect(res.headers['cache-control']).toBe(PUBLIC_CACHE_CONTROL);
    });
  });

  describe('GET /api/v1/content/insights/:slug (public)', () => {
    it('returns the published insight with both locales, category, and tags', async () => {
      const tag = await seedTag();
      const category = await seedCategory('Operations Design');
      const insight = await createInsight({
        slug: 'my-slug',
        status: 'PUBLISHED',
        categoryId: category.id,
        readTimeMinutes: 6,
      });
      await prisma.insightTag.create({
        data: { insightId: insight.id, tagId: tag.id },
      });

      const res = await request(app)
        .get('/api/v1/content/insights/my-slug-en')
        .expect(200);

      const data = asDetail(res.body).data;
      expect(data.status).toBe('PUBLISHED');
      expect(data.content.en?.title).toBe('Title EN (my-slug)');
      expect(data.content.de?.title).toBe('Title DE (my-slug)');
      expect(data.content.en?.body).toHaveLength(2);
      expect(data.category).toMatchObject({ name: 'Operations Design' });
      expect(data.tags).toEqual([{ id: tag.id, name: 'AI & Automation' }]);
    });

    it('resolves the slug against the de locale', async () => {
      await createInsight({ slug: 'my-slug', status: 'PUBLISHED' });

      const res = await request(app)
        .get('/api/v1/content/insights/my-slug-de')
        .expect(200);

      expect(asDetail(res.body).data.content.de?.title).toBe(
        'Title DE (my-slug)',
      );
    });

    it('returns 404 for a draft insight', async () => {
      await createInsight({ slug: 'draft-one' });

      const res = await request(app)
        .get('/api/v1/content/insights/draft-one-en')
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });

    it('returns 404 for an unknown slug', async () => {
      await request(app)
        .get('/api/v1/content/insights/does-not-exist-en')
        .expect(404);
    });
  });

  describe('GET /api/v1/content/admin/insights', () => {
    it('returns 401 without a session', async () => {
      await request(app).get('/api/v1/content/admin/insights').expect(401);
    });

    it('returns 403 for a client session', async () => {
      await request(app)
        .get('/api/v1/content/admin/insights')
        .set('cookie', clientCookie)
        .expect(403);
    });

    it('lists drafts and published records and filters by status', async () => {
      await createInsight({ slug: 'draft-one' });
      await createInsight({ slug: 'published-one', status: 'PUBLISHED' });

      const res = await request(app)
        .get('/api/v1/content/admin/insights?status=DRAFT')
        .set('cookie', adminCookie)
        .expect(200);

      const items = asList(res.body).items;
      expect(items).toHaveLength(1);
      expect(items[0]?.slugs.en).toBe('draft-one-en');
    });

    it('filters by categoryId', async () => {
      const category = await seedCategory();
      await createInsight({ slug: 'matched', categoryId: category.id });
      await createInsight({ slug: 'other' });

      const res = await request(app)
        .get(`/api/v1/content/admin/insights?categoryId=${category.id}`)
        .set('cookie', adminCookie)
        .expect(200);

      const items = asList(res.body).items;
      expect(items).toHaveLength(1);
      expect(items[0]?.slugs.en).toBe('matched-en');
    });
  });

  describe('GET /api/v1/content/admin/insights/:id', () => {
    it('returns the full detail for an admin', async () => {
      const insight = await createInsight({ slug: 'my-slug' });

      const res = await request(app)
        .get(`/api/v1/content/admin/insights/${insight.id}`)
        .set('cookie', adminCookie)
        .expect(200);

      const data = asDetail(res.body).data;
      expect(data.status).toBe('DRAFT');
      expect(data.author).toBe('Blih Ops Editorial');
      expect(data.content.en?.slug).toBe('my-slug-en');
      expect(data.content.de?.slug).toBe('my-slug-de');
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .get('/api/v1/content/admin/insights/does-not-exist')
        .set('cookie', adminCookie)
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/v1/content/admin/insights', () => {
    it('creates a draft with author required', async () => {
      const res = await request(app)
        .post('/api/v1/content/admin/insights')
        .set('cookie', adminCookie)
        .send({ author: 'Blih Ops Editorial' })
        .expect(201);

      expect(asDetail(res.body).data).toMatchObject({
        author: 'Blih Ops Editorial',
        status: 'DRAFT',
      });
    });

    it('returns 422 when the author is missing', async () => {
      await request(app)
        .post('/api/v1/content/admin/insights')
        .set('cookie', adminCookie)
        .send({})
        .expect(422);
    });

    it('returns 404 when a tag id does not exist', async () => {
      await request(app)
        .post('/api/v1/content/admin/insights')
        .set('cookie', adminCookie)
        .send({ author: 'Blih Ops Editorial', tags: ['does-not-exist'] })
        .expect(404);
    });
  });

  describe('PATCH /api/v1/content/admin/insights/:id', () => {
    it('replaces one locale content without touching the other', async () => {
      const insight = await createInsight({ slug: 'my-slug' });

      const res = await request(app)
        .patch(`/api/v1/content/admin/insights/${insight.id}`)
        .set('cookie', adminCookie)
        .send({
          locale: 'en',
          content: {
            title: 'New EN title',
            slug: 'new-slug-en',
            excerpt: 'New EN excerpt',
            body: [{ section: 'New section', content: '<p>New content</p>' }],
          },
        })
        .expect(200);

      const data = asDetail(res.body).data;
      expect(data.content.en?.title).toBe('New EN title');
      expect(data.content.de?.title).toBe('Title DE (my-slug)');
    });

    it('updates shared fields', async () => {
      const insight = await createInsight({ slug: 'my-slug' });

      const res = await request(app)
        .patch(`/api/v1/content/admin/insights/${insight.id}`)
        .set('cookie', adminCookie)
        .send({ author: 'Guest Author', readTimeMinutes: 9 })
        .expect(200);

      expect(asDetail(res.body).data.author).toBe('Guest Author');
      expect(asDetail(res.body).data.readTimeMinutes).toBe(9);
    });

    it('replaces the tag assignment', async () => {
      const oldTag = await seedTag();
      const newTag = await prisma.tag.create({ data: { name: 'Reporting' } });
      const insight = await createInsight({ slug: 'my-slug' });
      await prisma.insightTag.create({
        data: { insightId: insight.id, tagId: oldTag.id },
      });

      const res = await request(app)
        .patch(`/api/v1/content/admin/insights/${insight.id}`)
        .set('cookie', adminCookie)
        .send({ tags: [newTag.id] })
        .expect(200);

      expect(asDetail(res.body).data.tags).toEqual([
        { id: newTag.id, name: 'Reporting' },
      ]);
    });

    it('returns 404 when a tag id does not exist', async () => {
      const insight = await createInsight({ slug: 'my-slug' });

      await request(app)
        .patch(`/api/v1/content/admin/insights/${insight.id}`)
        .set('cookie', adminCookie)
        .send({ tags: ['does-not-exist'] })
        .expect(404);
    });

    it('returns 404 for an unknown id', async () => {
      await request(app)
        .patch('/api/v1/content/admin/insights/does-not-exist')
        .set('cookie', adminCookie)
        .send({ author: 'Guest' })
        .expect(404);
    });

    it('returns 422 for an empty body', async () => {
      const insight = await createInsight({ slug: 'my-slug' });

      await request(app)
        .patch(`/api/v1/content/admin/insights/${insight.id}`)
        .set('cookie', adminCookie)
        .send({})
        .expect(422);
    });
  });

  describe('POST /api/v1/content/admin/insights/:id/publish', () => {
    it('publishes a complete insight and makes it publicly visible', async () => {
      const insight = await createInsight({ slug: 'my-slug' });

      await request(app)
        .patch(`/api/v1/content/admin/insights/${insight.id}`)
        .set('cookie', adminCookie)
        .send({ readTimeMinutes: 6 })
        .expect(200);

      const res = await publishViaApi(insight.id).expect(200);

      expect(asDetail(res.body).data.status).toBe('PUBLISHED');

      const publicRes = await request(app)
        .get('/api/v1/content/insights/my-slug-en')
        .expect(200);
      expect(asDetail(publicRes.body).data.status).toBe('PUBLISHED');
    });

    it('returns 422 with details when the insight is incomplete', async () => {
      const category = await seedCategory();
      const insight = await prisma.insight.create({
        data: {
          author: 'Blih Ops Editorial',
          categoryId: category.id,
          readTimeMinutes: 0,
          media: completeMedia,
          content: {
            en: { title: 'Only a title' },
          },
        },
      });

      const res = await publishViaApi(insight.id).expect(422);

      const details = asError(res.body).error.details ?? [];
      const paths = details.map((detail) => detail.path);
      expect(paths).toContain('en.slug');
      expect(paths).toContain('en.body');
      expect(paths).toContain('de.');
      expect(paths).toContain('readTimeMinutes');
    });

    it('returns 422 when the slug is already used by another record', async () => {
      await createInsight({ slug: 'taken', status: 'PUBLISHED' });
      const candidateContent = completeContent('candidate');
      candidateContent.en = { ...candidateContent.en, slug: 'taken-en' };
      const candidate = await createInsight({
        slug: 'candidate',
        readTimeMinutes: 5,
        content: candidateContent,
      });

      const res = await publishViaApi(candidate.id).expect(409);

      expect(asError(res.body).error.code).toBe('CONTENT_SLUG_TAKEN');
    });

    it('unpublishes an insight and hides it from the public', async () => {
      const insight = await createInsight({
        slug: 'my-slug',
        status: 'PUBLISHED',
      });

      const res = await request(app)
        .post(`/api/v1/content/admin/insights/${insight.id}/unpublish`)
        .set('cookie', adminCookie)
        .expect(200);

      expect(asDetail(res.body).data.status).toBe('DRAFT');

      await request(app).get('/api/v1/content/insights/my-slug-en').expect(404);
    });

    it('applies edits to a published insight live', async () => {
      const insight = await createInsight({
        slug: 'my-slug',
        status: 'PUBLISHED',
      });

      await request(app)
        .patch(`/api/v1/content/admin/insights/${insight.id}`)
        .set('cookie', adminCookie)
        .send({
          locale: 'en',
          content: {
            title: 'Live edited title',
            slug: 'my-slug-en',
            excerpt: 'Updated excerpt',
            body: [{ section: 'Updated section', content: '<p>Updated</p>' }],
          },
        })
        .expect(200);

      const res = await request(app)
        .get('/api/v1/content/insights/my-slug-en')
        .expect(200);
      expect(asDetail(res.body).data.content.en?.title).toBe(
        'Live edited title',
      );
    });
  });

  describe('DELETE /api/v1/content/admin/insights/:id', () => {
    it('deletes an insight and its tag assignments but keeps the tag', async () => {
      const tag = await seedTag();
      const insight = await createInsight({ slug: 'my-slug' });
      await prisma.insightTag.create({
        data: { insightId: insight.id, tagId: tag.id },
      });

      const res = await request(app)
        .delete(`/api/v1/content/admin/insights/${insight.id}`)
        .set('cookie', adminCookie)
        .expect(204);

      expect(res.body).toEqual({});
      await expect(prisma.insight.count()).resolves.toBe(0);
      await expect(prisma.insightTag.count()).resolves.toBe(0);
      await expect(prisma.tag.count()).resolves.toBe(1);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .delete('/api/v1/content/admin/insights/does-not-exist')
        .set('cookie', adminCookie)
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });

    it('returns 401 without a session', async () => {
      const insight = await createInsight({ slug: 'my-slug' });

      await request(app)
        .delete(`/api/v1/content/admin/insights/${insight.id}`)
        .expect(401);
    });

    it('returns 403 for a client session', async () => {
      const insight = await createInsight({ slug: 'my-slug' });

      await request(app)
        .delete(`/api/v1/content/admin/insights/${insight.id}`)
        .set('cookie', clientCookie)
        .expect(403);
    });
  });
});
