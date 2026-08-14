import crypto from 'node:crypto';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { Prisma } from '../../../src/generated/prisma/client.js';
import { app } from '../../../src/app.js';
import { prisma } from '../../../src/shared/db/prisma.js';
import { createAdminSession, createClientSession } from '../../helpers/auth.js';
import { resetDatabase } from '../../setup/resetDatabase.js';

const WEBHOOK_SECRET =
  process.env.CALCOM_WEBHOOK_SECRET ?? 'test-calcom-webhook-secret';

const contactPayload = {
  fullName: 'Jane Doe',
  workEmail: 'jane@acme.com',
  company: 'Acme GmbH',
  topic: 'Partnership',
  message: 'We would like to explore outsourcing our support operations.',
  locale: 'en',
};

const pilotPayload = {
  fullName: 'Jane Doe',
  workEmail: 'jane@acme.com',
  company: 'Acme GmbH',
  service: 'Customer support',
  challenge: 'Our ticket backlog is growing faster than the team can handle.',
  volume: '100–500 tasks per month',
  timeline: 'Within 30 days',
  context: 'Team of 12, EU timezone overlap needed.',
  locale: 'en',
};

type LeadListItem = {
  id: string;
  type: string;
  status: string;
  fullName: string;
  workEmail: string;
  company: string | null;
  createdAt: string;
  updatedAt: string;
};

type ListBody = { items: LeadListItem[]; meta: Record<string, unknown> };
type SingleBody = { data: Record<string, unknown> };
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

const createLead = (
  overrides: Partial<{
    type: 'CONTACT' | 'PILOT' | 'CALL';
    status: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED';
    fullName: string;
    workEmail: string;
    company: string | null;
    calBookingUid: string;
    details: Prisma.InputJsonValue;
  }> = {},
) =>
  prisma.lead.create({
    data: {
      type: overrides.type ?? 'PILOT',
      status: overrides.status ?? 'NEW',
      fullName: overrides.fullName ?? 'Jane Doe',
      workEmail: overrides.workEmail ?? 'jane@acme.com',
      company: overrides.company ?? 'Acme GmbH',
      ...(overrides.calBookingUid !== undefined
        ? { calBookingUid: overrides.calBookingUid }
        : {}),
      details:
        overrides.details ??
        ({
          service: 'Customer support',
          challenge: 'Ticket backlog is growing.',
          volume: '100–500 tasks per month',
          timeline: 'Within 30 days',
          locale: 'en',
        } satisfies Prisma.InputJsonValue),
    },
  });

const signWebhook = (payload: unknown) => {
  const raw = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(raw)
    .digest('hex');
  return { raw, signature };
};

const postWebhook = (payload: unknown, signature?: string) => {
  const { raw, signature: sig } = signWebhook(payload);
  return request(app)
    .post('/api/v1/leads/webhooks/calcom')
    .set('content-type', 'application/json')
    .set('x-cal-signature-256', signature ?? `sha256=${sig}`)
    .send(raw);
};

const bookingCreatedPayload = {
  triggerEvent: 'BOOKING_CREATED',
  payload: {
    uid: 'cal-booking-1',
    startTime: '2026-08-20T14:00:00.000Z',
    timeZone: 'Europe/Berlin',
    url: 'https://cal.com/yonatane-mk-sa4cic/discovery-call/cal-booking-1',
    attendees: [
      { name: 'Jane Doe', email: 'jane@acme.com', timeZone: 'Europe/Berlin' },
    ],
    responses: {
      Company: { label: 'Company', value: 'Acme GmbH' },
      "What's the main challenge you'd like to solve?": {
        label: "What's the main challenge you'd like to solve?",
        value: 'Ticket backlog',
      },
      'How did you hear about us?': { label: 'x', value: 'LinkedIn' },
      'Team size?': { label: 'x', value: '10-50' },
    },
  },
};

describe('leads resource', () => {
  let adminCookie: string;
  let clientCookie: string;

  beforeAll(async () => {
    adminCookie = (await createAdminSession()).cookie;
    clientCookie = await createClientSession();
  });

  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  describe('POST /api/v1/leads/contact (public)', () => {
    it('creates a CONTACT lead with status NEW', async () => {
      const res = await request(app)
        .post('/api/v1/leads/contact')
        .send(contactPayload)
        .expect(201);

      expect(asSingle(res.body).data).toMatchObject({
        type: 'CONTACT',
        status: 'NEW',
      });
      expect(asSingle(res.body).data.id).toBeTypeOf('string');

      const lead = await prisma.lead.findFirst({ where: { type: 'CONTACT' } });
      expect(lead).toMatchObject({
        fullName: 'Jane Doe',
        workEmail: 'jane@acme.com',
        company: 'Acme GmbH',
        status: 'NEW',
      });
      expect(lead?.details).toMatchObject({
        topic: 'Partnership',
        message: contactPayload.message,
        locale: 'en',
      });
    });

    it('returns 422 for an invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/leads/contact')
        .send({ ...contactPayload, workEmail: 'not-an-email' })
        .expect(422);

      expect(asError(res.body).error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 422 for an invalid topic', async () => {
      await request(app)
        .post('/api/v1/leads/contact')
        .send({ ...contactPayload, topic: 'Not a real topic' })
        .expect(422);
    });

    it('defaults company to null and locale to en', async () => {
      const { company: _company, ...withoutCompany } = contactPayload;
      void _company;

      const res = await request(app)
        .post('/api/v1/leads/contact')
        .send(withoutCompany)
        .expect(201);

      expect(asSingle(res.body).data.type).toBe('CONTACT');
      const lead = await prisma.lead.findFirst({ where: { type: 'CONTACT' } });
      expect(lead?.company).toBeNull();
      expect(lead?.details).toMatchObject({ locale: 'en' });
    });

    it('treats a non-empty honeypot as a bot: 201 but nothing persisted', async () => {
      const res = await request(app)
        .post('/api/v1/leads/contact')
        .send({ ...contactPayload, website: 'http://spam.example.com' })
        .expect(201);

      expect(asSingle(res.body).data.status).toBe('NEW');
      await expect(prisma.lead.count()).resolves.toBe(0);
    });
  });

  describe('POST /api/v1/leads/pilot (public)', () => {
    it('creates a PILOT lead with all details mapped', async () => {
      const res = await request(app)
        .post('/api/v1/leads/pilot')
        .send(pilotPayload)
        .expect(201);

      expect(asSingle(res.body).data).toMatchObject({
        type: 'PILOT',
        status: 'NEW',
      });

      const lead = await prisma.lead.findFirst({ where: { type: 'PILOT' } });
      expect(lead?.company).toBe('Acme GmbH');
      expect(lead?.details).toMatchObject({
        service: 'Customer support',
        challenge: pilotPayload.challenge,
        volume: '100–500 tasks per month',
        timeline: 'Within 30 days',
        context: 'Team of 12, EU timezone overlap needed.',
        locale: 'en',
      });
    });

    it('returns 422 when company is missing (required for pilot)', async () => {
      const { company: _company, ...withoutCompany } = pilotPayload;
      void _company;

      await request(app)
        .post('/api/v1/leads/pilot')
        .send(withoutCompany)
        .expect(422);
    });

    it('treats a non-empty honeypot as a bot: 201 but nothing persisted', async () => {
      await request(app)
        .post('/api/v1/leads/pilot')
        .send({ ...pilotPayload, website: 'http://spam.example.com' })
        .expect(201);

      await expect(prisma.lead.count()).resolves.toBe(0);
    });
  });

  describe('POST /api/v1/leads/webhooks/calcom', () => {
    it('returns 401 without a signature', async () => {
      const res = await request(app)
        .post('/api/v1/leads/webhooks/calcom')
        .set('content-type', 'application/json')
        .send(JSON.stringify(bookingCreatedPayload))
        .expect(401);

      expect(asError(res.body).error.code).toBe('LEAD_WEBHOOK_INVALID');
    });

    it('returns 401 for a tampered signature', async () => {
      await postWebhook(bookingCreatedPayload, 'sha256=deadbeef').expect(401);
    });

    it('creates a CALL lead from BOOKING_CREATED with popup answers', async () => {
      const res = await postWebhook(bookingCreatedPayload).expect(200);

      expect(asSingle(res.body).data).toEqual({ ok: true });

      const lead = await prisma.lead.findFirst({ where: { type: 'CALL' } });
      expect(lead).toMatchObject({
        fullName: 'Jane Doe',
        workEmail: 'jane@acme.com',
        company: 'Acme GmbH',
        calBookingUid: 'cal-booking-1',
        status: 'NEW',
      });
      expect(lead?.details).toMatchObject({
        bookingTime: '2026-08-20T14:00:00.000Z',
        timezone: 'Europe/Berlin',
        bookingUrl: bookingCreatedPayload.payload.url,
        challenge: 'Ticket backlog',
        hearAbout: 'LinkedIn',
        teamSize: '10-50',
      });
    });

    it('is idempotent: duplicate deliveries create one lead', async () => {
      await postWebhook(bookingCreatedPayload).expect(200);
      await postWebhook(bookingCreatedPayload).expect(200);

      await expect(prisma.lead.count()).resolves.toBe(1);
    });

    it('closes the matched lead on BOOKING_CANCELLED', async () => {
      await postWebhook(bookingCreatedPayload).expect(200);

      const res = await postWebhook({
        triggerEvent: 'BOOKING_CANCELLED',
        payload: { uid: 'cal-booking-1' },
      }).expect(200);

      expect(asSingle(res.body).data).toEqual({ ok: true });

      const lead = await prisma.lead.findFirst({ where: { type: 'CALL' } });
      expect(lead?.status).toBe('CLOSED');
      const details = lead?.details as Record<string, unknown> | undefined;
      expect(details?.cancelledAt).toBeTypeOf('string');
    });

    it('does not downgrade a CONVERTED lead on cancellation', async () => {
      await postWebhook(bookingCreatedPayload).expect(200);
      await prisma.lead.updateMany({
        where: { calBookingUid: 'cal-booking-1' },
        data: { status: 'CONVERTED' },
      });

      await postWebhook({
        triggerEvent: 'BOOKING_CANCELLED',
        payload: { uid: 'cal-booking-1' },
      }).expect(200);

      const lead = await prisma.lead.findFirst({ where: { type: 'CALL' } });
      expect(lead?.status).toBe('CONVERTED');
    });

    it('ignores cancellation for an unknown booking uid (no lead created)', async () => {
      const res = await postWebhook({
        triggerEvent: 'BOOKING_CANCELLED',
        payload: { uid: 'never-existed' },
      }).expect(200);

      expect(asSingle(res.body).data).toEqual({ ok: true });
      await expect(prisma.lead.count()).resolves.toBe(0);
    });

    it('updates booking time and url on BOOKING_RESCHEDULED without touching status', async () => {
      await postWebhook(bookingCreatedPayload).expect(200);

      await postWebhook({
        triggerEvent: 'BOOKING_RESCHEDULED',
        payload: {
          uid: 'cal-booking-1',
          startTime: '2026-08-21T09:00:00.000Z',
          url: 'https://cal.com/yonatane-mk-sa4cic/discovery-call/rescheduled-1',
        },
      }).expect(200);

      const lead = await prisma.lead.findFirst({ where: { type: 'CALL' } });
      expect(lead?.status).toBe('NEW');
      expect(lead?.details).toMatchObject({
        bookingTime: '2026-08-21T09:00:00.000Z',
        bookingUrl:
          'https://cal.com/yonatane-mk-sa4cic/discovery-call/rescheduled-1',
      });
    });

    it('acknowledges unknown events with 200 without creating anything', async () => {
      const res = await postWebhook({
        triggerEvent: 'FORM_SUBMITTED',
        payload: { uid: 'x' },
      }).expect(200);

      expect(asSingle(res.body).data).toEqual({ ok: true });
      await expect(prisma.lead.count()).resolves.toBe(0);
    });
  });

  describe('GET /api/v1/leads/admin', () => {
    it('returns 401 without a session', async () => {
      await request(app).get('/api/v1/leads/admin').expect(401);
    });

    it('returns 403 for a client session', async () => {
      await request(app)
        .get('/api/v1/leads/admin')
        .set('cookie', clientCookie)
        .expect(403);
    });

    it('lists leads newest first without details', async () => {
      await createLead();
      await createLead({ type: 'CONTACT', company: null });

      const res = await request(app)
        .get('/api/v1/leads/admin')
        .set('cookie', adminCookie)
        .expect(200);

      const body = asList(res.body);
      expect(body.items).toHaveLength(2);
      expect(body.items[0]?.type).toBe('CONTACT'); // newest first
      expect(body.items[0]).not.toHaveProperty('details');
      expect(body.meta).toMatchObject({ page: 1, pageSize: 20, total: 2 });
    });

    it('filters by type and status', async () => {
      await createLead({ type: 'CONTACT', company: null });
      await createLead();

      const res = await request(app)
        .get('/api/v1/leads/admin?type=CONTACT&status=NEW')
        .set('cookie', adminCookie)
        .expect(200);

      const items = asList(res.body).items;
      expect(items).toHaveLength(1);
      expect(items[0]?.type).toBe('CONTACT');
    });

    it('searches name, email, and company case-insensitively', async () => {
      await createLead({
        fullName: 'John Smith',
        workEmail: 'john@acme.com',
        company: 'Acme Inc',
      });
      await createLead({
        fullName: 'Anna Weber',
        workEmail: 'anna@other.de',
        company: 'Other GmbH',
      });

      const byCompany = await request(app)
        .get('/api/v1/leads/admin?q=acme')
        .set('cookie', adminCookie)
        .expect(200);
      expect(asList(byCompany.body).items).toHaveLength(1);
      expect(asList(byCompany.body).items[0]?.fullName).toBe('John Smith');

      const byName = await request(app)
        .get('/api/v1/leads/admin?q=anna')
        .set('cookie', adminCookie)
        .expect(200);
      expect(asList(byName.body).items).toHaveLength(1);

      const none = await request(app)
        .get('/api/v1/leads/admin?q=nobody-here')
        .set('cookie', adminCookie)
        .expect(200);
      expect(asList(none.body).items).toHaveLength(0);
    });

    it('paginates', async () => {
      await createLead();
      await createLead();

      const res = await request(app)
        .get('/api/v1/leads/admin?page=1&pageSize=1')
        .set('cookie', adminCookie)
        .expect(200);

      const body = asList(res.body);
      expect(body.items).toHaveLength(1);
      expect(body.meta).toMatchObject({
        page: 1,
        pageSize: 1,
        total: 2,
        totalPages: 2,
      });
    });
  });

  describe('GET /api/v1/leads/admin/:id', () => {
    it('returns the full lead including details and calBookingUid', async () => {
      const lead = await createLead({ calBookingUid: 'cal-booking-9' });

      const res = await request(app)
        .get(`/api/v1/leads/admin/${lead.id}`)
        .set('cookie', adminCookie)
        .expect(200);

      const data = asSingle(res.body).data;
      expect(data).toMatchObject({
        id: lead.id,
        type: 'PILOT',
        status: 'NEW',
        fullName: 'Jane Doe',
        calBookingUid: 'cal-booking-9',
      });
      expect(data.details).toMatchObject({ service: 'Customer support' });
    });

    it('returns 404 LEAD_NOT_FOUND for an unknown id', async () => {
      const res = await request(app)
        .get('/api/v1/leads/admin/does-not-exist')
        .set('cookie', adminCookie)
        .expect(404);

      expect(asError(res.body).error.code).toBe('LEAD_NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/leads/admin/:id', () => {
    it('updates the status', async () => {
      const lead = await createLead();

      const res = await request(app)
        .patch(`/api/v1/leads/admin/${lead.id}`)
        .set('cookie', adminCookie)
        .send({ status: 'CONTACTED' })
        .expect(200);

      expect(asSingle(res.body).data.status).toBe('CONTACTED');
    });

    it('returns 404 LEAD_NOT_FOUND for an unknown id', async () => {
      const res = await request(app)
        .patch('/api/v1/leads/admin/does-not-exist')
        .set('cookie', adminCookie)
        .send({ status: 'CONTACTED' })
        .expect(404);

      expect(asError(res.body).error.code).toBe('LEAD_NOT_FOUND');
    });

    it('returns 422 for an invalid status', async () => {
      const lead = await createLead();

      await request(app)
        .patch(`/api/v1/leads/admin/${lead.id}`)
        .set('cookie', adminCookie)
        .send({ status: 'WON' })
        .expect(422);
    });

    it('returns 422 when extra fields are sent (status-only PATCH)', async () => {
      const lead = await createLead();

      const res = await request(app)
        .patch(`/api/v1/leads/admin/${lead.id}`)
        .set('cookie', adminCookie)
        .send({ status: 'CONTACTED', fullName: 'Hacked' })
        .expect(422);

      expect(asError(res.body).error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/v1/leads/admin/:id', () => {
    it('deletes a lead with 204 and no body', async () => {
      const lead = await createLead();

      const res = await request(app)
        .delete(`/api/v1/leads/admin/${lead.id}`)
        .set('cookie', adminCookie)
        .expect(204);

      expect(res.body).toEqual({});
      await expect(prisma.lead.count()).resolves.toBe(0);
    });

    it('returns 404 LEAD_NOT_FOUND for an unknown id', async () => {
      const res = await request(app)
        .delete('/api/v1/leads/admin/does-not-exist')
        .set('cookie', adminCookie)
        .expect(404);

      expect(asError(res.body).error.code).toBe('LEAD_NOT_FOUND');
    });

    it('returns 401 without a session', async () => {
      const lead = await createLead();

      await request(app).delete(`/api/v1/leads/admin/${lead.id}`).expect(401);
    });
  });
});
