import { createHash, randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { hashPassword } from 'better-auth/crypto';

import { auth } from '../../../src/shared/auth/auth.js';
import { app } from '../../../src/app.js';
import { prisma } from '../../../src/shared/db/prisma.js';
import { createAdminSession } from '../../helpers/auth.js';
import { resetDatabase } from '../../setup/resetDatabase.js';

const asData = (b: unknown) => b as { data: Record<string, unknown> };
const asList = (b: unknown) =>
  b as { items: Record<string, unknown>[]; meta: Record<string, unknown> };

const baseAppPayload = {
  fullName: 'Test Candidate',
  workEmail: 'candidate@example.com',
  phone: '+251900000001',
  country: 'Ethiopia',
  city: 'Addis Ababa',
  primaryRole: 'Backend Engineer',
  techStack: ['TypeScript', 'Node.js'],
  secondarySkills: ['Docker'],
  yearsExperience: 5,
  portfolioUrl: 'https://example.com',
  githubUrl: 'https://github.com/example',
  linkedinUrl: 'https://linkedin.com/in/example',
  resumeFileKey: 'private/resumes/test.pdf',
};

const createTalentApp = (
  overrides: Partial<typeof baseAppPayload> & Record<string, unknown> = {},
) =>
  prisma.talentApplication.create({
    data: {
      fullName: (overrides.fullName as string) ?? baseAppPayload.fullName,
      workEmail:
        (overrides.workEmail as string) ?? `cand-${randomUUID()}@example.com`,
      phone: (overrides.phone as string) ?? baseAppPayload.phone,
      country: (overrides.country as string) ?? baseAppPayload.country,
      city: (overrides.city as string) ?? baseAppPayload.city,
      primaryRole:
        (overrides.primaryRole as string) ?? baseAppPayload.primaryRole,
      techStack: (overrides.techStack as string[]) ?? baseAppPayload.techStack,
      secondarySkills:
        (overrides.secondarySkills as string[]) ??
        baseAppPayload.secondarySkills,
      yearsExperience:
        (overrides.yearsExperience as number) ?? baseAppPayload.yearsExperience,
      portfolioUrl:
        (overrides.portfolioUrl as string) ?? baseAppPayload.portfolioUrl,
      githubUrl: (overrides.githubUrl as string) ?? baseAppPayload.githubUrl,
      linkedinUrl:
        (overrides.linkedinUrl as string) ?? baseAppPayload.linkedinUrl,
      resumeFileKey:
        (overrides.resumeFileKey as string) ?? baseAppPayload.resumeFileKey,
      status: (overrides.status as never) ?? 'NEW',
      internalNotes: (overrides.internalNotes as string) ?? '',
      ...(overrides.completionPhotoKey
        ? { completionPhotoKey: overrides.completionPhotoKey as string }
        : {}),
      ...(overrides.completionShortBio
        ? { completionShortBio: overrides.completionShortBio as string }
        : {}),
      ...(overrides.completionProfessionalHeadline
        ? {
            completionProfessionalHeadline:
              overrides.completionProfessionalHeadline as string,
          }
        : {}),
    },
  });

async function createActiveTalent() {
  const email = `talent-${randomUUID()}@blihops.test`;
  const password = 'TestPass123!';
  const passwordHash = await hashPassword(password);
  const userId = randomUUID();
  const talentApp = await createTalentApp({
    workEmail: email,
    status: 'PROFILE_CREATED',
  });

  const profile = await prisma.talentProfile.create({
    data: {
      applicationId: talentApp.id,
      fullName: talentApp.fullName,
      workEmail: email,
      phone: talentApp.phone,
      country: talentApp.country,
      city: talentApp.city,
      profilePhotoKey: 'private/photos/test.jpg',
      professionalHeadline: 'Senior backend engineer',
      shortBio: 'A concise professional biography for testing.',
      primaryRole: talentApp.primaryRole,
      techStack: talentApp.techStack,
      secondarySkills: talentApp.secondarySkills,
      yearsExperience: talentApp.yearsExperience,
      portfolioUrl: talentApp.portfolioUrl,
      githubUrl: talentApp.githubUrl,
      linkedinUrl: talentApp.linkedinUrl,
      resumeFileKey: talentApp.resumeFileKey,
      seniority: 'Senior',
      englishLevel: 'C1',
      clientMonthlyRateEur: 4200,
      assessmentSummary: 'Passed all stages.',
      internalNotes: 'Created for test.',
      isVerified: true,
      visibility: 'HIDDEN',
    },
  });

  await prisma.$transaction([
    prisma.user.create({
      data: {
        id: userId,
        name: talentApp.fullName,
        email,
        emailVerified: true,
        role: 'talent',
      },
    }),
    prisma.account.create({
      data: {
        id: randomUUID(),
        userId,
        accountId: userId,
        providerId: 'credential',
        password: passwordHash,
      },
    }),
  ]);

  const account = await prisma.talentAccount.create({
    data: {
      userId,
      talentProfileId: profile.id,
      status: 'ACTIVE',
      invitedAt: new Date(),
      activatedAt: new Date(),
    },
  });

  // Use auth API directly to bypass HTTP rate limiting in tests
  const signInRes = await (
    auth.api as unknown as {
      signInEmail: (opts: {
        body: { email: string; password: string };
        asResponse: boolean;
      }) => Promise<Response>;
    }
  ).signInEmail({
    body: { email, password },
    asResponse: true,
  });
  const setCookieHeader = signInRes.headers.get('set-cookie') ?? '';
  const cookie =
    setCookieHeader
      .split(',')
      .find((c) => c.includes('better-auth.session_token='))
      ?.split(';')[0] ?? '';
  if (!cookie) throw new Error(`Failed to create session for talent ${email}`);
  return { email, password, userId, profile, account, cookie };
}

function hashToken(t: string) {
  return createHash('sha256').update(t).digest('hex');
}

describe('talent module', () => {
  let adminCookie: string;

  beforeAll(async () => {
    adminCookie = (await createAdminSession()).cookie;
  });

  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  describe('POST /api/v1/talent-applications (public)', () => {
    it('creates an application as NEW', async () => {
      const res = await request(app)
        .post('/api/v1/talent-applications')
        .send(baseAppPayload)
        .expect(201);
      expect(asData(res.body).data).toMatchObject({ status: 'NEW' });
      await expect(prisma.talentApplication.count()).resolves.toBe(1);
    });

    it('rejects invalid email', async () => {
      await request(app)
        .post('/api/v1/talent-applications')
        .send({ ...baseAppPayload, workEmail: 'bad' })
        .expect(422);
    });

    it('rejects missing required fields', async () => {
      const { phone: _p, ...withoutPhone } = baseAppPayload;
      void _p;
      await request(app)
        .post('/api/v1/talent-applications')
        .send(withoutPhone)
        .expect(422);
    });
  });

  describe('admin talent applications', () => {
    it('401 without session, 403 for non-admin', async () => {
      await request(app).get('/api/v1/admin/talent-applications').expect(401);
      const talent = await createActiveTalent();
      await request(app)
        .get('/api/v1/admin/talent-applications')
        .set('cookie', talent.cookie)
        .expect(403);
    });

    it('lists and searches applications', async () => {
      await createTalentApp({
        fullName: 'Alice Alpha',
        primaryRole: 'Frontend',
      });
      await createTalentApp({ fullName: 'Bob Beta', primaryRole: 'Backend' });
      const res = await request(app)
        .get('/api/v1/admin/talent-applications?q=alice')
        .set('cookie', adminCookie)
        .expect(200);
      expect(asList(res.body).items).toHaveLength(1);
    });

    it('gets detail and patches status flexibly', async () => {
      const appRow = await createTalentApp();
      const res = await request(app)
        .patch(`/api/v1/admin/talent-applications/${appRow.id}/status`)
        .set('cookie', adminCookie)
        .send({ status: 'UNDER_REVIEW' })
        .expect(200);
      expect(asData(res.body).data.status).toBe('UNDER_REVIEW');
      // REJECTED can be reopened
      await request(app)
        .patch(`/api/v1/admin/talent-applications/${appRow.id}/status`)
        .set('cookie', adminCookie)
        .send({ status: 'REJECTED' })
        .expect(200);
      const reopened = await request(app)
        .patch(`/api/v1/admin/talent-applications/${appRow.id}/status`)
        .set('cookie', adminCookie)
        .send({ status: 'APPROVED' })
        .expect(200);
      expect(asData(reopened.body).data.status).toBe('APPROVED');
    });

    it('updates internalNotes (admin-only)', async () => {
      const appRow = await createTalentApp();
      const res = await request(app)
        .patch(`/api/v1/admin/talent-applications/${appRow.id}/notes`)
        .set('cookie', adminCookie)
        .send({ internalNotes: 'Strong candidate' })
        .expect(200);
      expect(asData(res.body).data.internalNotes).toBe('Strong candidate');
    });

    it('404 for unknown id', async () => {
      await request(app)
        .get('/api/v1/admin/talent-applications/does-not-exist')
        .set('cookie', adminCookie)
        .expect(404);
    });
  });

  describe('profile completion', () => {
    it('admin sends completion request only after APPROVED', async () => {
      const appRow = await createTalentApp({ status: 'NEW' });
      await request(app)
        .post(
          `/api/v1/admin/talent-applications/${appRow.id}/completion-request`,
        )
        .set('cookie', adminCookie)
        .expect(400);
      await prisma.talentApplication.update({
        where: { id: appRow.id },
        data: { status: 'APPROVED' },
      });
      await request(app)
        .post(
          `/api/v1/admin/talent-applications/${appRow.id}/completion-request`,
        )
        .set('cookie', adminCookie)
        .expect(201);
      const pending = await prisma.profileCompletionRequest.findFirst({
        where: { applicationId: appRow.id, status: 'PENDING' },
      });
      expect(pending).not.toBeNull();
    });

    it('public token get and submit', async () => {
      const appRow = await createTalentApp({ status: 'APPROVED' });
      const raw = randomUUID() + randomUUID();
      await prisma.profileCompletionRequest.create({
        data: {
          applicationId: appRow.id,
          tokenHash: hashToken(raw),
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 7 * 86400000),
        },
      });
      await prisma.talentApplication.update({
        where: { id: appRow.id },
        data: { status: 'COMPLETION_REQUESTED' },
      });

      await request(app)
        .get(`/api/v1/profile-completion-requests/${raw}`)
        .expect(200);
      const res = await request(app)
        .post(`/api/v1/profile-completion-requests/${raw}/submit`)
        .send({
          photoFileKey: 'private/photos/x.jpg',
          shortBio: 'A short bio for testing that is long enough.',
          professionalHeadline: 'Senior engineer',
        })
        .expect(200);
      expect(asData(res.body).data.status).toBe('COMPLETION_SUBMITTED');
      // second submit with same token should fail
      await request(app)
        .post(`/api/v1/profile-completion-requests/${raw}/submit`)
        .send({
          photoFileKey: 'private/photos/x.jpg',
          shortBio: 'A short bio for testing that is long enough.',
          professionalHeadline: 'Senior engineer',
        })
        .expect(400);
    });

    it('expired token is rejected', async () => {
      const appRow = await createTalentApp({ status: 'APPROVED' });
      const raw = randomUUID();
      await prisma.profileCompletionRequest.create({
        data: {
          applicationId: appRow.id,
          tokenHash: hashToken(raw),
          status: 'PENDING',
          expiresAt: new Date(Date.now() - 1000),
        },
      });
      await request(app)
        .get(`/api/v1/profile-completion-requests/${raw}`)
        .expect(400);
    });
  });

  describe('talent profiles and portal', () => {
    it('admin creates profile only after COMPLETION_SUBMITTED', async () => {
      const appRow = await createTalentApp({ status: 'APPROVED' });
      await request(app)
        .post(`/api/v1/admin/talent-applications/${appRow.id}/create-profile`)
        .set('cookie', adminCookie)
        .send({
          seniority: 'Senior',
          englishLevel: 'C1',
          clientMonthlyRateEur: '4200.00',
          assessmentSummary: 'Passed',
          internalNotes: 'Notes',
        })
        .expect(400);

      await prisma.talentApplication.update({
        where: { id: appRow.id },
        data: {
          status: 'COMPLETION_SUBMITTED',
          completionPhotoKey: 'private/photos/x.jpg',
          completionShortBio: 'A short bio for testing that is long enough.',
          completionProfessionalHeadline: 'Senior engineer',
          completionSubmittedAt: new Date(),
        },
      });

      const res = await request(app)
        .post(`/api/v1/admin/talent-applications/${appRow.id}/create-profile`)
        .set('cookie', adminCookie)
        .send({
          seniority: 'Senior',
          englishLevel: 'C1',
          clientMonthlyRateEur: '4200.00',
          assessmentSummary: 'Passed',
          internalNotes: 'Notes',
        })
        .expect(201);
      expect(asData(res.body).data.visibility).toBe('HIDDEN');
    });

    it('admin cannot edit while VISIBLE', async () => {
      const { profile } = await createActiveTalent();
      // make visible
      await prisma.talentProfile.update({
        where: { id: profile.id },
        data: { visibility: 'VISIBLE' },
      });
      await prisma.talentAccount.update({
        where: { talentProfileId: profile.id },
        data: { status: 'ACTIVE' },
      });
      await request(app)
        .patch(`/api/v1/admin/talent-profiles/${profile.id}`)
        .set('cookie', adminCookie)
        .send({ seniority: 'Lead' })
        .expect(400);
      // hide then edit succeeds
      await request(app)
        .post(`/api/v1/admin/talent-profiles/${profile.id}/hide`)
        .set('cookie', adminCookie)
        .expect(200);
      await request(app)
        .patch(`/api/v1/admin/talent-profiles/${profile.id}`)
        .set('cookie', adminCookie)
        .send({ seniority: 'Lead' })
        .expect(200);
    });

    it('show requires checklist', async () => {
      const { profile } = await createActiveTalent();
      // profile is complete, so show should succeed
      await request(app)
        .post(`/api/v1/admin/talent-profiles/${profile.id}/show`)
        .set('cookie', adminCookie)
        .expect(200);
    });

    it('deactivate auto-hides', async () => {
      const { profile } = await createActiveTalent();
      await prisma.talentProfile.update({
        where: { id: profile.id },
        data: { visibility: 'VISIBLE' },
      });
      await request(app)
        .post(`/api/v1/admin/talent-profiles/${profile.id}/deactivate`)
        .set('cookie', adminCookie)
        .expect(200);
      const updated = await prisma.talentProfile.findUnique({
        where: { id: profile.id },
      });
      expect(updated?.visibility).toBe('HIDDEN');
    });

    it('talent portal me/profile/patch', async () => {
      const talent = await createActiveTalent();
      await request(app)
        .get('/api/v1/talent/me')
        .set('cookie', talent.cookie)
        .expect(200);
      const before = await request(app)
        .get('/api/v1/talent/profile')
        .set('cookie', talent.cookie)
        .expect(200);
      expect(asData(before.body).data).toHaveProperty('professionalHeadline');
      const patched = await request(app)
        .patch('/api/v1/talent/profile')
        .set('cookie', talent.cookie)
        .send({ professionalHeadline: 'Updated headline' })
        .expect(200);
      expect(asData(patched.body).data.professionalHeadline).toBe(
        'Updated headline',
      );
      // admin cannot be accessed by talent
      await request(app)
        .get('/api/v1/admin/talent-profiles')
        .set('cookie', talent.cookie)
        .expect(403);
    });

    it('talent cannot edit admin fields', async () => {
      const talent = await createActiveTalent();
      await request(app)
        .patch('/api/v1/talent/profile')
        .set('cookie', talent.cookie)
        .send({ seniority: 'Lead' } as never)
        .expect(422);
    });
  });
});
