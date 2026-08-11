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
    summary: `Summary EN (${slug})`,
    body: {
      challenge: '<h2>The challenge</h2><p>Challenge text</p>',
      approach: '<h2>The approach</h2><p>Approach text</p>',
      outcome: '<h2>The outcome</h2><p>Outcome text</p>',
    },
  },
  de: {
    title: `Title DE (${slug})`,
    slug: `${slug}-de`,
    summary: `Summary DE (${slug})`,
    body: {
      challenge: '<h2>Die Herausforderung</h2><p>Text</p>',
      approach: '<h2>Der Ansatz</h2><p>Text</p>',
      outcome: '<h2>Das Ergebnis</h2><p>Text</p>',
    },
  },
});

const completeMedia = { type: 'image', url: 'https://example.com/hero.jpg' };

type ListItem = {
  id: string;
  slugs: { en: string; de: string };
  titles: { en: string; de: string };
  client: string;
  status?: 'DRAFT' | 'PUBLISHED';
  bodyComplete?: { en: boolean; de: boolean };
  createdAt: string;
};

type DetailBody = {
  data: {
    id: string;
    client: string;
    media: { type: 'image' | 'video'; url: string; alt?: string };
    status: 'DRAFT' | 'PUBLISHED';
    content: {
      en?: { title: string; slug: string; summary: string };
      de?: { title: string; slug: string; summary: string };
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

describe('case studies resource', () => {
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

  const seedTag = () => prisma.tag.create({ data: { name: 'SaaS' } });

  const createCaseStudy = async (
    overrides: {
      slug?: string;
      status?: 'DRAFT' | 'PUBLISHED';
      categoryId?: string | null;
      media?: unknown;
      content?: unknown;
    } = {},
  ) => {
    const category = await seedCategory();
    const slug = overrides.slug ?? 'my-slug';
    return prisma.caseStudy.create({
      data: {
        client: 'Acme',
        categoryId: overrides.categoryId ?? category.id,
        media: overrides.media ?? completeMedia,
        status: overrides.status ?? 'DRAFT',
        content: overrides.content ?? completeContent(slug),
      },
    });
  };

  const publishViaApi = (id: string) =>
    request(app)
      .post(`/api/v1/content/admin/case-studies/${id}/publish`)
      .set('cookie', adminCookie);

  describe('GET /api/v1/content/case-studies (public)', () => {
    it('returns an empty list with paginated meta', async () => {
      const res = await request(app)
        .get('/api/v1/content/case-studies')
        .expect(200);

      expect(res.body).toEqual({
        items: [],
        meta: { page: 1, pageSize: 12, total: 0, totalPages: 0 },
      });
    });

    it('returns only published case studies', async () => {
      await createCaseStudy({ slug: 'draft-one' });
      await createCaseStudy({ slug: 'published-one', status: 'PUBLISHED' });

      const res = await request(app)
        .get('/api/v1/content/case-studies')
        .expect(200);

      const items = asList(res.body).items;
      expect(items).toHaveLength(1);
      expect(items[0]?.slugs.en).toBe('published-one-en');
      expect(items[0]).not.toHaveProperty('status');
    });

    it('returns published case studies newest first', async () => {
      const first = await createCaseStudy({
        slug: 'first',
        status: 'PUBLISHED',
      });
      const second = await createCaseStudy({
        slug: 'second',
        status: 'PUBLISHED',
      });

      const res = await request(app)
        .get('/api/v1/content/case-studies')
        .expect(200);

      expect(asList(res.body).items.map((item) => item.id)).toEqual([
        second.id,
        first.id,
      ]);
    });

    it('paginates results with meta', async () => {
      for (const slug of ['one', 'two', 'three']) {
        await createCaseStudy({ slug, status: 'PUBLISHED' });
      }

      const res = await request(app)
        .get('/api/v1/content/case-studies?page=1&pageSize=2')
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
        .get('/api/v1/content/case-studies?pageSize=101')
        .expect(422);
    });

    it('sets public cache headers', async () => {
      const res = await request(app).get('/api/v1/content/case-studies');

      expect(res.headers['cache-control']).toBe(PUBLIC_CACHE_CONTROL);
    });
  });

  describe('GET /api/v1/content/case-studies/:slug (public)', () => {
    it('returns the published case study with both locales, category, and tags', async () => {
      const tag = await seedTag();
      const category = await seedCategory('Customer Support');
      const caseStudy = await createCaseStudy({
        slug: 'my-slug',
        status: 'PUBLISHED',
        categoryId: category.id,
      });
      await prisma.caseStudyTag.create({
        data: { caseStudyId: caseStudy.id, tagId: tag.id },
      });

      const res = await request(app)
        .get('/api/v1/content/case-studies/my-slug-en')
        .expect(200);

      const data = asDetail(res.body).data;
      expect(data.status).toBe('PUBLISHED');
      expect(data.content.en?.title).toBe('Title EN (my-slug)');
      expect(data.content.de?.title).toBe('Title DE (my-slug)');
      expect(data.category).toMatchObject({ name: 'Customer Support' });
      expect(data.tags).toEqual([{ id: tag.id, name: 'SaaS' }]);
    });

    it('resolves the slug against the de locale', async () => {
      await createCaseStudy({ slug: 'my-slug', status: 'PUBLISHED' });

      const res = await request(app)
        .get('/api/v1/content/case-studies/my-slug-de')
        .expect(200);

      expect(asDetail(res.body).data.content.de?.title).toBe(
        'Title DE (my-slug)',
      );
    });

    it('returns 404 for a draft case study', async () => {
      await createCaseStudy({ slug: 'draft-one' });

      const res = await request(app)
        .get('/api/v1/content/case-studies/draft-one-en')
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });

    it('returns 404 for an unknown slug', async () => {
      await request(app)
        .get('/api/v1/content/case-studies/does-not-exist-en')
        .expect(404);
    });
  });

  describe('GET /api/v1/content/admin/case-studies', () => {
    it('returns 401 without a session', async () => {
      await request(app).get('/api/v1/content/admin/case-studies').expect(401);
    });

    it('returns 403 for a client session', async () => {
      await request(app)
        .get('/api/v1/content/admin/case-studies')
        .set('cookie', clientCookie)
        .expect(403);
    });

    it('lists drafts and published records and filters by status', async () => {
      await createCaseStudy({ slug: 'draft-one' });
      await createCaseStudy({ slug: 'published-one', status: 'PUBLISHED' });

      const res = await request(app)
        .get('/api/v1/content/admin/case-studies?status=DRAFT')
        .set('cookie', adminCookie)
        .expect(200);

      const items = asList(res.body).items;
      expect(items).toHaveLength(1);
      expect(items[0]?.slugs.en).toBe('draft-one-en');
      expect(items[0]?.status).toBe('DRAFT');

      const publishedRes = await request(app)
        .get('/api/v1/content/admin/case-studies?status=PUBLISHED')
        .set('cookie', adminCookie)
        .expect(200);
      expect(asList(publishedRes.body).items[0]?.status).toBe('PUBLISHED');
    });

    it('filters by categoryId', async () => {
      const category = await seedCategory();
      await createCaseStudy({ slug: 'matched', categoryId: category.id });
      await createCaseStudy({ slug: 'other' });

      const res = await request(app)
        .get(`/api/v1/content/admin/case-studies?categoryId=${category.id}`)
        .set('cookie', adminCookie)
        .expect(200);

      const items = asList(res.body).items;
      expect(items).toHaveLength(1);
      expect(items[0]?.slugs.en).toBe('matched-en');
    });
  });

  describe('GET /api/v1/content/admin/case-studies/:id', () => {
    it('returns the full detail for an admin', async () => {
      const caseStudy = await createCaseStudy({ slug: 'my-slug' });

      const res = await request(app)
        .get(`/api/v1/content/admin/case-studies/${caseStudy.id}`)
        .set('cookie', adminCookie)
        .expect(200);

      const data = asDetail(res.body).data;
      expect(data.status).toBe('DRAFT');
      expect(data.content.en?.slug).toBe('my-slug-en');
      expect(data.content.de?.slug).toBe('my-slug-de');
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .get('/api/v1/content/admin/case-studies/does-not-exist')
        .set('cookie', adminCookie)
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/v1/content/admin/case-studies', () => {
    it('creates a draft with client required', async () => {
      const res = await request(app)
        .post('/api/v1/content/admin/case-studies')
        .set('cookie', adminCookie)
        .send({ client: 'Acme' })
        .expect(201);

      expect(asDetail(res.body).data).toMatchObject({
        client: 'Acme',
        status: 'DRAFT',
      });
    });

    it('returns 422 when the client is missing', async () => {
      await request(app)
        .post('/api/v1/content/admin/case-studies')
        .set('cookie', adminCookie)
        .send({})
        .expect(422);
    });

    it('returns 404 when a tag id does not exist', async () => {
      await request(app)
        .post('/api/v1/content/admin/case-studies')
        .set('cookie', adminCookie)
        .send({ client: 'Acme', tags: ['does-not-exist'] })
        .expect(404);
    });
  });

  describe('PATCH /api/v1/content/admin/case-studies/:id', () => {
    it('replaces one locale content without touching the other', async () => {
      const caseStudy = await createCaseStudy({ slug: 'my-slug' });

      const res = await request(app)
        .patch(`/api/v1/content/admin/case-studies/${caseStudy.id}`)
        .set('cookie', adminCookie)
        .send({
          locale: 'en',
          content: {
            title: 'New EN title',
            slug: 'new-slug-en',
            summary: 'New EN summary',
            body: {
              challenge: '<p>New challenge</p>',
              approach: '<p>New approach</p>',
              outcome: '<p>New outcome</p>',
            },
          },
        })
        .expect(200);

      const data = asDetail(res.body).data;
      expect(data.content.en?.title).toBe('New EN title');
      expect(data.content.de?.title).toBe('Title DE (my-slug)');
    });

    it('updates shared fields', async () => {
      const category = await seedCategory();
      const caseStudy = await createCaseStudy({ slug: 'my-slug' });

      const res = await request(app)
        .patch(`/api/v1/content/admin/case-studies/${caseStudy.id}`)
        .set('cookie', adminCookie)
        .send({ client: 'Beta Corp', categoryId: category.id })
        .expect(200);

      expect(asDetail(res.body).data.client).toBe('Beta Corp');
    });

    it('replaces the tag assignment', async () => {
      const oldTag = await seedTag();
      const newTag = await prisma.tag.create({ data: { name: 'Logistics' } });
      const caseStudy = await createCaseStudy({ slug: 'my-slug' });
      await prisma.caseStudyTag.create({
        data: { caseStudyId: caseStudy.id, tagId: oldTag.id },
      });

      const res = await request(app)
        .patch(`/api/v1/content/admin/case-studies/${caseStudy.id}`)
        .set('cookie', adminCookie)
        .send({ tags: [newTag.id] })
        .expect(200);

      expect(asDetail(res.body).data.tags).toEqual([
        { id: newTag.id, name: 'Logistics' },
      ]);
    });

    it('clears all tags with an empty array', async () => {
      const oldTag = await seedTag();
      const caseStudy = await createCaseStudy({ slug: 'my-slug' });
      await prisma.caseStudyTag.create({
        data: { caseStudyId: caseStudy.id, tagId: oldTag.id },
      });

      const res = await request(app)
        .patch(`/api/v1/content/admin/case-studies/${caseStudy.id}`)
        .set('cookie', adminCookie)
        .send({ tags: [] })
        .expect(200);

      expect(asDetail(res.body).data.tags).toEqual([]);
    });

    it('clears the media with a null value', async () => {
      const caseStudy = await createCaseStudy({
        slug: 'my-slug',
        media: { type: 'image', url: 'https://example.com/cover.jpg' },
      });

      const res = await request(app)
        .patch(`/api/v1/content/admin/case-studies/${caseStudy.id}`)
        .set('cookie', adminCookie)
        .send({ media: null })
        .expect(200);

      expect(asDetail(res.body).data.media).toEqual({
        type: 'image',
        url: '',
      });
    });

    it('returns bodyComplete flags in the admin list', async () => {
      await createCaseStudy({ slug: 'complete-slug' });
      await createCaseStudy({
        slug: 'incomplete-slug',
        content: {
          en: { title: 'Only a title', slug: 'incomplete-slug' },
          de: { title: 'Nur ein Titel', slug: 'incomplete-slug' },
        },
      });

      const res = await request(app)
        .get('/api/v1/content/admin/case-studies')
        .set('cookie', adminCookie)
        .expect(200);

      const items = asList(res.body).items;
      const complete = items.find(
        (item) => item.slugs.en === 'complete-slug-en',
      );
      const incomplete = items.find(
        (item) => item.slugs.en === 'incomplete-slug',
      );

      expect(complete?.bodyComplete).toEqual({ en: true, de: true });
      expect(incomplete?.bodyComplete).toEqual({ en: false, de: false });
    });

    it('returns 404 when a tag id does not exist', async () => {
      const caseStudy = await createCaseStudy({ slug: 'my-slug' });

      await request(app)
        .patch(`/api/v1/content/admin/case-studies/${caseStudy.id}`)
        .set('cookie', adminCookie)
        .send({ tags: ['does-not-exist'] })
        .expect(404);
    });

    it('returns 404 for an unknown id', async () => {
      await request(app)
        .patch('/api/v1/content/admin/case-studies/does-not-exist')
        .set('cookie', adminCookie)
        .send({ client: 'Acme' })
        .expect(404);
    });

    it('returns 422 for an empty body', async () => {
      const caseStudy = await createCaseStudy({ slug: 'my-slug' });

      await request(app)
        .patch(`/api/v1/content/admin/case-studies/${caseStudy.id}`)
        .set('cookie', adminCookie)
        .send({})
        .expect(422);
    });
  });

  describe('POST /api/v1/content/admin/case-studies/:id/publish', () => {
    it('publishes a complete case study and makes it publicly visible', async () => {
      const caseStudy = await createCaseStudy({ slug: 'my-slug' });

      const res = await publishViaApi(caseStudy.id).expect(200);

      expect(asDetail(res.body).data.status).toBe('PUBLISHED');

      const publicRes = await request(app)
        .get('/api/v1/content/case-studies/my-slug-en')
        .expect(200);
      expect(asDetail(publicRes.body).data.status).toBe('PUBLISHED');
    });

    it('returns 422 with details when the case study is incomplete', async () => {
      const caseStudy = await prisma.caseStudy.create({
        data: {
          client: 'Acme',
          media: completeMedia,
          content: {
            en: { title: 'Only a title' },
          },
        },
      });

      const res = await publishViaApi(caseStudy.id).expect(422);

      const details = asError(res.body).error.details ?? [];
      const paths = details.map((detail) => detail.path);
      expect(paths).toContain('en.slug');
      expect(paths).toContain('en.summary');
      expect(paths).toContain('de.');
      expect(paths).toContain('categoryId');
    });

    it('returns 422 when the slug is already used by another record', async () => {
      await createCaseStudy({ slug: 'taken', status: 'PUBLISHED' });
      const candidateContent = completeContent('candidate');
      candidateContent.en = { ...candidateContent.en, slug: 'taken-en' };
      const candidate = await createCaseStudy({
        slug: 'candidate',
        content: candidateContent,
      });

      const res = await publishViaApi(candidate.id).expect(409);

      expect(asError(res.body).error.code).toBe('CONTENT_SLUG_TAKEN');
    });

    it('unpublishes a case study and hides it from the public', async () => {
      const caseStudy = await createCaseStudy({
        slug: 'my-slug',
        status: 'PUBLISHED',
      });

      const res = await request(app)
        .post(`/api/v1/content/admin/case-studies/${caseStudy.id}/unpublish`)
        .set('cookie', adminCookie)
        .expect(200);

      expect(asDetail(res.body).data.status).toBe('DRAFT');

      await request(app)
        .get('/api/v1/content/case-studies/my-slug-en')
        .expect(404);
    });

    it('applies edits to a published case study live', async () => {
      const caseStudy = await createCaseStudy({
        slug: 'my-slug',
        status: 'PUBLISHED',
      });

      await request(app)
        .patch(`/api/v1/content/admin/case-studies/${caseStudy.id}`)
        .set('cookie', adminCookie)
        .send({
          locale: 'en',
          content: {
            title: 'Live edited title',
            slug: 'my-slug-en',
            summary: 'Updated summary',
            body: {
              challenge: '<p>Updated challenge</p>',
              approach: '<p>Updated approach</p>',
              outcome: '<p>Updated outcome</p>',
            },
          },
        })
        .expect(200);

      const res = await request(app)
        .get('/api/v1/content/case-studies/my-slug-en')
        .expect(200);
      expect(asDetail(res.body).data.content.en?.title).toBe(
        'Live edited title',
      );
    });
  });

  describe('DELETE /api/v1/content/admin/case-studies/:id', () => {
    it('deletes a case study and its tag assignments but keeps the tag', async () => {
      const tag = await seedTag();
      const caseStudy = await createCaseStudy({ slug: 'my-slug' });
      await prisma.caseStudyTag.create({
        data: { caseStudyId: caseStudy.id, tagId: tag.id },
      });

      const res = await request(app)
        .delete(`/api/v1/content/admin/case-studies/${caseStudy.id}`)
        .set('cookie', adminCookie)
        .expect(204);

      expect(res.body).toEqual({});
      await expect(prisma.caseStudy.count()).resolves.toBe(0);
      await expect(prisma.caseStudyTag.count()).resolves.toBe(0);
      await expect(prisma.tag.count()).resolves.toBe(1);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .delete('/api/v1/content/admin/case-studies/does-not-exist')
        .set('cookie', adminCookie)
        .expect(404);

      expect(asError(res.body).error.code).toBe('NOT_FOUND');
    });

    it('returns 401 without a session', async () => {
      const caseStudy = await createCaseStudy({ slug: 'my-slug' });

      await request(app)
        .delete(`/api/v1/content/admin/case-studies/${caseStudy.id}`)
        .expect(401);
    });

    it('returns 403 for a client session', async () => {
      const caseStudy = await createCaseStudy({ slug: 'my-slug' });

      await request(app)
        .delete(`/api/v1/content/admin/case-studies/${caseStudy.id}`)
        .set('cookie', clientCookie)
        .expect(403);
    });
  });
});
