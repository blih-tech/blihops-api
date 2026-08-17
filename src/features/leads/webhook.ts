import crypto from 'node:crypto';

import { env } from '../../shared/configs/env.js';

export type CalWebhookEvent = {
  triggerEvent: string;
  uid: string | undefined;
  rescheduleUid: string | undefined;
  startTime: string | undefined;
  endTime: string | undefined;
  timeZone: string | undefined;
  bookingUrl: string | undefined;
  meetingUrl: string | undefined;
  attendeeName: string | undefined;
  attendeeEmail: string | undefined;
  company: string | undefined;
  challenge: string | undefined;
  hearAbout: string | undefined;
  teamSize: string | undefined;
};

const CAL_QUESTION_KEYS = {
  company: ['Company', 'company'],
  challenge: [
    "What's the main challenge you'd like to solve?",
    'challenge',
    'Main challenge',
  ],
  hearAbout: ['How did you hear about us?', 'hearAbout'],
  teamSize: ['Team size?', 'teamSize'],
} as const;

export function verifyCalSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
): boolean {
  if (
    signatureHeader === undefined ||
    env.CALCOM_WEBHOOK_SECRET === undefined
  ) {
    return false;
  }
  const provided = signatureHeader.replace(/^sha256=/, '');
  // Strict hex validation keeps timingSafeEqual from throwing on garbage
  // input (a non-hex value of the right length would otherwise 500).
  if (!/^[0-9a-f]{64}$/i.test(provided)) {
    return false;
  }
  const expected = crypto
    .createHmac('sha256', env.CALCOM_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(provided, 'hex'),
  );
}

function firstString(
  responses: Record<string, unknown>,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const value = responses[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
    // Cal.com sends custom answers as objects: { label, value } (older) or
    // { label, response } (newer) — both wrapped in the value/response key.
    if (typeof value === 'object' && value !== null) {
      const answer = value as Record<string, unknown>;
      const raw = answer.value ?? answer.response;
      if (typeof raw === 'string' && raw.trim().length > 0) {
        return raw;
      }
    }
  }
  return undefined;
}

export function extractCalWebhookEvent(body: unknown): CalWebhookEvent {
  const record = (
    typeof body === 'object' && body !== null ? body : {}
  ) as Record<string, unknown>;
  const payload = (
    typeof record.payload === 'object' && record.payload !== null
      ? record.payload
      : {}
  ) as Record<string, unknown>;
  const attendees = Array.isArray(payload.attendees) ? payload.attendees : [];
  const attendee = (
    typeof attendees[0] === 'object' && attendees[0] !== null
      ? attendees[0]
      : {}
  ) as Record<string, unknown>;
  const responses = (
    typeof payload.responses === 'object' && payload.responses !== null
      ? payload.responses
      : {}
  ) as Record<string, unknown>;
  // Cal.com does not include a top-level timeZone on the payload; the
  // attendee's zone is the reliable source, so fall back to it.
  const attendeeTimeZone =
    typeof attendee.timeZone === 'string' ? attendee.timeZone : undefined;
  const videoCallData = (
    typeof payload.videoCallData === 'object' && payload.videoCallData !== null
      ? payload.videoCallData
      : {}
  ) as Record<string, unknown>;
  const metadata = (
    typeof payload.metadata === 'object' && payload.metadata !== null
      ? payload.metadata
      : {}
  ) as Record<string, unknown>;

  return {
    triggerEvent:
      typeof record.triggerEvent === 'string' ? record.triggerEvent : 'UNKNOWN',
    uid: typeof payload.uid === 'string' ? payload.uid : undefined,
    rescheduleUid:
      typeof payload.rescheduleUid === 'string'
        ? payload.rescheduleUid
        : undefined,
    startTime:
      typeof payload.startTime === 'string' ? payload.startTime : undefined,
    endTime: typeof payload.endTime === 'string' ? payload.endTime : undefined,
    timeZone:
      typeof payload.timeZone === 'string'
        ? payload.timeZone
        : attendeeTimeZone,
    bookingUrl: typeof payload.url === 'string' ? payload.url : undefined,
    meetingUrl:
      typeof videoCallData.url === 'string'
        ? videoCallData.url
        : typeof metadata.videoCallUrl === 'string'
          ? metadata.videoCallUrl
          : undefined,
    attendeeName: typeof attendee.name === 'string' ? attendee.name : undefined,
    attendeeEmail:
      typeof attendee.email === 'string' ? attendee.email : undefined,
    company: firstString(responses, CAL_QUESTION_KEYS.company),
    challenge: firstString(responses, CAL_QUESTION_KEYS.challenge),
    hearAbout: firstString(responses, CAL_QUESTION_KEYS.hearAbout),
    teamSize: firstString(responses, CAL_QUESTION_KEYS.teamSize),
  };
}
