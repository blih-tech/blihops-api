import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import type { LeadStatus, LeadType } from '../../generated/prisma/client.js';

extendZodWithOpenApi(z);

export const leadTypeSchema = z.enum(['CONTACT', 'PILOT', 'CALL']);

export const leadStatusSchema = z.enum([
  'NEW',
  'CONTACTED',
  'CONVERTED',
  'CLOSED',
]);

export const localeSchema = z.enum(['en', 'de']);

export const contactTopics = [
  'Outsourcing services',
  'AI and workflow automation',
  'Partnership',
  'General enquiry',
] as const;

export const pilotServices = [
  'Customer support',
  'Back-office operations',
  'Data processing',
  'IT and software support',
  'AI and workflow automation',
  'Not sure yet',
] as const;

export const pilotVolumes = [
  'Under 100 tasks per month',
  '100–500 tasks per month',
  '500–2,000 tasks per month',
  'More than 2,000 tasks per month',
  'It varies or is not measured yet',
] as const;

export const pilotTimelines = [
  'As soon as possible',
  'Within 30 days',
  'Within 1–3 months',
  'Just exploring for now',
] as const;

const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Full name is required')
  .max(80, 'Keep the name under 80 characters');

const workEmailSchema = z
  .string()
  .trim()
  .email('Enter a valid email address')
  .max(254, 'Keep the email under 254 characters');

const optionalLocaleSchema = localeSchema.default('en');

/** Honeypot trap field — real users never see it; non-empty means a bot. */
const honeypotSchema = z
  .string()
  .max(200, 'Keep the honeypot field under 200 characters')
  .optional();

export const contactLeadBodySchema = z.object({
  fullName: fullNameSchema,
  workEmail: workEmailSchema,
  company: z
    .string()
    .trim()
    .max(120, 'Keep the company under 120 characters')
    .optional(),
  topic: z.enum(contactTopics, 'Please choose a topic'),
  message: z
    .string()
    .trim()
    .min(20, 'Your message is too short')
    .max(1500, 'Keep the message under 1500 characters'),
  locale: optionalLocaleSchema,
  website: honeypotSchema,
});

export const pilotLeadBodySchema = z.object({
  fullName: fullNameSchema,
  workEmail: workEmailSchema,
  company: z
    .string()
    .trim()
    .min(2, 'Company is required')
    .max(120, 'Keep the company under 120 characters'),
  service: z.enum(pilotServices, 'Please choose a service'),
  challenge: z
    .string()
    .trim()
    .min(20, 'Describe the challenge in more detail')
    .max(1200, 'Keep the challenge under 1200 characters'),
  volume: z.enum(pilotVolumes, 'Please choose a volume'),
  timeline: z.enum(pilotTimelines, 'Please choose a timeline'),
  context: z
    .string()
    .trim()
    .max(1000, 'Keep the context under 1000 characters')
    .optional(),
  locale: optionalLocaleSchema,
  website: honeypotSchema,
});

const idParamSchema = z.string().min(1, 'Id is required').max(50);

export const leadIdParamsSchema = z.object({
  id: idParamSchema,
});

export const patchLeadStatusBodySchema = z.strictObject({
  status: leadStatusSchema,
});

export const leadListQuerySchema = z.object({
  type: leadTypeSchema.optional(),
  status: leadStatusSchema.optional(),
  q: z
    .string()
    .trim()
    .max(100, 'Keep the search under 100 characters')
    .optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20).optional(),
});

export type ContactLeadPayload = z.infer<typeof contactLeadBodySchema>;
export type PilotLeadPayload = z.infer<typeof pilotLeadBodySchema>;

export const leadListItemSchema = z.object({
  id: z.string(),
  type: leadTypeSchema,
  status: leadStatusSchema,
  fullName: z.string(),
  workEmail: z.string(),
  company: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const leadDetailSchema = leadListItemSchema.extend({
  calBookingUid: z.string().nullable(),
  details: z.record(z.string(), z.unknown()),
});

export const leadCreatedResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    type: leadTypeSchema,
    status: leadStatusSchema,
  }),
});

export const leadListResponseSchema = z.object({
  items: z.array(leadListItemSchema),
  meta: z.record(z.string(), z.unknown()),
});

export const leadDetailResponseSchema = z.object({
  data: leadDetailSchema,
});

export const webhookAckResponseSchema = z.object({
  data: z.object({ ok: z.boolean() }),
});

export type LeadListItem = {
  id: string;
  type: LeadType;
  status: LeadStatus;
  fullName: string;
  workEmail: string;
  company: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadDetail = LeadListItem & {
  calBookingUid: string | null;
  details: Record<string, unknown>;
};

export type LeadCreatedResponse = {
  id: string;
  type: LeadType;
  status: LeadStatus;
};
