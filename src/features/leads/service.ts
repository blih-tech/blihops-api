import type { Lead as LeadRow } from '../../generated/prisma/client.js';
import { Prisma } from '../../generated/prisma/client.js';

import { logger } from '../../shared/configs/logger.js';
import { LeadNotFoundError } from '../../shared/errors/httpErrors.js';
import type {
  ContactLeadPayload,
  LeadCreatedResponse,
  LeadDetail,
  LeadListItem,
  PilotLeadPayload,
} from './schema.js';
import {
  createLeadRecord,
  deleteLeadRecord,
  findByCalBookingUid,
  findLeadById,
  findLeads,
  isRecordNotFound,
  isUniqueViolation,
  updateLeadRecord,
} from './repository.js';
import type { CalWebhookEvent } from './webhook.js';

function toLeadListItem(
  lead: Omit<LeadRow, 'details' | 'calBookingUid'>,
): LeadListItem {
  return {
    id: lead.id,
    type: lead.type,
    status: lead.status,
    fullName: lead.fullName,
    workEmail: lead.workEmail,
    company: lead.company,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

function toLeadDetail(lead: LeadRow): LeadDetail {
  return {
    ...toLeadListItem(lead),
    calBookingUid: lead.calBookingUid,
    details: lead.details as Record<string, unknown>,
  };
}

function toCreatedResponse(lead: LeadRow): LeadCreatedResponse {
  return { id: lead.id, type: lead.type, status: lead.status };
}

export async function createContactLead(
  payload: ContactLeadPayload,
): Promise<LeadCreatedResponse> {
  const lead = await createLeadRecord({
    type: 'CONTACT',
    status: 'NEW',
    fullName: payload.fullName,
    workEmail: payload.workEmail,
    company: payload.company ?? null,
    details: {
      topic: payload.topic,
      message: payload.message,
      locale: payload.locale,
    },
  });
  return toCreatedResponse(lead);
}

export async function createPilotLead(
  payload: PilotLeadPayload,
): Promise<LeadCreatedResponse> {
  const lead = await createLeadRecord({
    type: 'PILOT',
    status: 'NEW',
    fullName: payload.fullName,
    workEmail: payload.workEmail,
    company: payload.company,
    details: {
      service: payload.service,
      challenge: payload.challenge,
      volume: payload.volume,
      timeline: payload.timeline,
      ...(payload.context !== undefined ? { context: payload.context } : {}),
      locale: payload.locale,
    },
  });
  return toCreatedResponse(lead);
}

export async function handleCalWebhook(event: CalWebhookEvent): Promise<void> {
  switch (event.triggerEvent) {
    case 'BOOKING_CREATED': {
      if (event.uid === undefined) {
        logger.warn(
          { triggerEvent: event.triggerEvent },
          'booking event without uid, ignored',
        );
        return;
      }
      if (event.attendeeEmail === undefined || event.attendeeEmail === '') {
        logger.warn(
          { uid: event.uid },
          'booking without attendee email, lead not created',
        );
        return;
      }
      const details: Record<string, unknown> = {};
      if (event.startTime !== undefined) details.bookingTime = event.startTime;
      if (event.timeZone !== undefined) details.timezone = event.timeZone;
      if (event.bookingUrl !== undefined) details.bookingUrl = event.bookingUrl;
      if (event.challenge !== undefined) details.challenge = event.challenge;
      if (event.hearAbout !== undefined) details.hearAbout = event.hearAbout;
      if (event.teamSize !== undefined) details.teamSize = event.teamSize;
      try {
        // The unique calBookingUid column makes this atomic — a concurrent
        // retry of the same booking hits the constraint and becomes a no-op.
        await createLeadRecord({
          type: 'CALL',
          status: 'NEW',
          fullName: event.attendeeName ?? 'Unknown attendee',
          workEmail: event.attendeeEmail,
          company: event.company ?? null,
          calBookingUid: event.uid,
          details: details as Prisma.InputJsonValue,
        });
      } catch (err) {
        if (!isUniqueViolation(err)) {
          throw err;
        }
      }
      break;
    }
    case 'BOOKING_CANCELLED': {
      if (event.uid === undefined) {
        logger.warn(
          { triggerEvent: event.triggerEvent },
          'booking event without uid, ignored',
        );
        return;
      }
      const existing = await findByCalBookingUid(event.uid);
      if (existing === null) {
        logger.warn(
          { uid: event.uid },
          'cancelled booking has no matching lead, ignored',
        );
        return;
      }
      if (existing.status === 'CONVERTED') {
        logger.warn(
          { uid: event.uid },
          'cancelled booking lead is already CONVERTED, keeping status',
        );
        return;
      }
      const details = {
        ...(existing.details as Record<string, unknown>),
        cancelledAt: new Date().toISOString(),
      };
      await updateLeadRecord(existing.id, {
        status: 'CLOSED',
        details,
      });
      break;
    }
    case 'BOOKING_RESCHEDULED': {
      if (event.uid === undefined) {
        logger.warn(
          { triggerEvent: event.triggerEvent },
          'booking event without uid, ignored',
        );
        return;
      }
      const existing = await findByCalBookingUid(event.uid);
      if (existing === null) {
        logger.warn(
          { uid: event.uid },
          'rescheduled booking has no matching lead, ignored',
        );
        return;
      }
      const details = {
        ...(existing.details as Record<string, unknown>),
        ...(event.startTime !== undefined
          ? { bookingTime: event.startTime }
          : {}),
        ...(event.bookingUrl !== undefined
          ? { bookingUrl: event.bookingUrl }
          : {}),
      };
      await updateLeadRecord(existing.id, { details });
      break;
    }
    default:
      break; // unknown events: acknowledge (200) so Cal.com stops retrying
  }
}

export async function listLeads(filters: {
  type?: 'CONTACT' | 'PILOT' | 'CALL';
  status?: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED';
  q?: string;
  page: number;
  pageSize: number;
}) {
  const where: Prisma.LeadWhereInput = {};
  if (filters.type !== undefined) where.type = filters.type;
  if (filters.status !== undefined) where.status = filters.status;
  if (filters.q !== undefined && filters.q.length > 0) {
    where.OR = [
      { fullName: { contains: filters.q, mode: 'insensitive' } },
      { workEmail: { contains: filters.q, mode: 'insensitive' } },
      { company: { contains: filters.q, mode: 'insensitive' } },
    ];
  }
  const [leads, total] = await findLeads(where, filters.page, filters.pageSize);
  return { items: leads.map(toLeadListItem), total };
}

export async function getLead(id: string): Promise<LeadDetail> {
  const lead = await findLeadById(id);
  if (lead === null) {
    throw new LeadNotFoundError('Lead not found');
  }
  return toLeadDetail(lead);
}

export async function updateLeadStatus(
  id: string,
  status: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED',
): Promise<LeadDetail> {
  try {
    const lead = await updateLeadRecord(id, { status });
    return toLeadDetail(lead);
  } catch (err) {
    if (isRecordNotFound(err)) {
      throw new LeadNotFoundError('Lead not found');
    }
    throw err;
  }
}

export async function deleteLead(id: string): Promise<void> {
  try {
    await deleteLeadRecord(id);
  } catch (err) {
    if (isRecordNotFound(err)) {
      throw new LeadNotFoundError('Lead not found');
    }
    throw err;
  }
}
