import { describe, expect, it } from 'vitest';

import { generateOpenApiDocument } from '../../src/shared/openapi/document.js';

describe('openapi document', () => {
  it('marks public content paths without security', async () => {
    const doc = await generateOpenApiDocument();
    const paths = doc.paths;

    expect(paths['/api/v1/content/tags']?.get?.security).toBeUndefined();
    expect(paths['/api/v1/content/categories']?.get?.security).toBeUndefined();
    expect(
      paths['/api/v1/content/case-studies']?.get?.security,
    ).toBeUndefined();
    expect(
      paths['/api/v1/content/case-studies/{slug}']?.get?.security,
    ).toBeUndefined();
    expect(
      paths['/api/v1/content/insights/{slug}']?.get?.security,
    ).toBeUndefined();
    expect(paths['/api/v1/content/faqs']?.get?.security).toBeUndefined();
  });

  it('requires cookie security on admin content paths', async () => {
    const doc = await generateOpenApiDocument();
    const paths = doc.paths;

    expect(paths['/api/v1/content/admin/tags']?.get?.security).toEqual([
      { apiKeyCookie: [] },
    ]);
    expect(paths['/api/v1/content/admin/case-studies']?.get?.security).toEqual([
      { apiKeyCookie: [] },
    ]);
    expect(paths['/api/v1/content/admin/faqs']?.post?.security).toEqual([
      { apiKeyCookie: [] },
    ]);
  });

  it('marks better-auth public paths without security', async () => {
    const doc = await generateOpenApiDocument();
    const paths = doc.paths;

    expect(paths['/api/v1/auth/sign-in/email']?.post?.security).toBeUndefined();
    expect(paths['/api/v1/auth/accept-invite']?.post?.security).toBeUndefined();
    expect(
      paths['/api/v1/auth/request-password-reset']?.post?.security,
    ).toBeUndefined();
  });

  it('keeps cookie-or-bearer security on the invite endpoint', async () => {
    const doc = await generateOpenApiDocument();
    const paths = doc.paths;

    expect(paths['/api/v1/auth/invite']?.post?.security).toEqual([
      { apiKeyCookie: [] },
      { bearerAuth: [] },
    ]);
  });
});
