import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const talentApplicationStatusSchema = z.enum([
  'NEW',
  'UNDER_REVIEW',
  'SCREENING',
  'TECHNICAL_ASSESSMENT',
  'ENGLISH_ASSESSMENT',
  'REMOTE_READINESS_ASSESSMENT',
  'APPROVED',
  'COMPLETION_REQUESTED',
  'COMPLETION_SUBMITTED',
  'PROFILE_CREATED',
  'REJECTED',
  'ARCHIVED',
]);

const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Full name is required')
  .max(80, 'Keep the name under 80 characters');

const workEmailSchema = z
  .string()
  .trim()
  .email('Enter a valid email address')
  .max(254, 'Keep the email under 254 characters')
  .transform((v) => v.toLowerCase());

const phoneSchema = z
  .string()
  .trim()
  .min(7, 'Phone is required')
  .max(40, 'Keep the phone under 40 characters');

const countrySchema = z
  .string()
  .trim()
  .min(2, 'Country is required')
  .max(80, 'Keep the country under 80 characters');

const citySchema = z
  .string()
  .trim()
  .min(2, 'City is required')
  .max(80, 'Keep the city under 80 characters');

const primaryRoleSchema = z
  .string()
  .trim()
  .min(1, 'Primary role is required')
  .max(80, 'Keep the role under 80 characters');

const skillItemSchema = z.string().trim().min(1).max(50);

const optionalUrl = z.union([
  z.literal(''),
  z
    .string()
    .trim()
    .url('Enter a valid URL')
    .max(300, 'Keep the URL under 300 characters'),
]);

const resumeFileKeySchema = z
  .string()
  .trim()
  .min(1, 'Resume is required')
  .max(500, 'Keep the file key under 500 characters');

export const createTalentApplicationBodySchema = z.strictObject({
  fullName: fullNameSchema,
  workEmail: workEmailSchema,
  phone: phoneSchema,
  country: countrySchema,
  city: citySchema,
  primaryRole: primaryRoleSchema,
  techStack: z.array(skillItemSchema).min(1, 'Add at least one tech').max(30),
  secondarySkills: z.array(skillItemSchema).max(30).default([]),
  yearsExperience: z.coerce.number().int().min(0).max(50),
  portfolioUrl: optionalUrl.optional(),
  githubUrl: optionalUrl.optional(),
  linkedinUrl: optionalUrl.optional(),
  resumeFileKey: resumeFileKeySchema,
});

export const patchTalentApplicationStatusBodySchema = z.strictObject({
  status: talentApplicationStatusSchema,
});

export const patchTalentApplicationNotesBodySchema = z.strictObject({
  internalNotes: z.string().max(5000, 'Keep notes under 5000 characters'),
});

const idParamSchema = z.string().min(1, 'Id is required').max(50);

export const talentApplicationIdParamsSchema = z.object({
  id: idParamSchema,
});

export const talentApplicationListQuerySchema = z.object({
  status: talentApplicationStatusSchema.optional(),
  q: z
    .string()
    .trim()
    .max(100, 'Keep the search under 100 characters')
    .optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20).optional(),
});

export const talentApplicationListItemSchema = z.object({
  id: z.string(),
  status: talentApplicationStatusSchema,
  fullName: z.string(),
  workEmail: z.string(),
  phone: z.string(),
  country: z.string(),
  city: z.string(),
  primaryRole: z.string(),
  yearsExperience: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const talentApplicationDetailSchema =
  talentApplicationListItemSchema.extend({
    techStack: z.array(z.string()),
    secondarySkills: z.array(z.string()),
    portfolioUrl: z.string().nullable(),
    githubUrl: z.string().nullable(),
    linkedinUrl: z.string().nullable(),
    resumeFileKey: z.string(),
    completionPhotoKey: z.string().nullable(),
    completionShortBio: z.string().nullable(),
    completionProfessionalHeadline: z.string().nullable(),
    completionSubmittedAt: z.string().nullable(),
    internalNotes: z.string(),
    talentProfileId: z.string().nullable(),
  });

export const talentApplicationCreatedResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    status: talentApplicationStatusSchema,
  }),
});

export const talentApplicationListResponseSchema = z.object({
  items: z.array(talentApplicationListItemSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    totalPages: z.number(),
  }),
});

export const talentApplicationDetailResponseSchema = z.object({
  data: talentApplicationDetailSchema,
});

export type CreateTalentApplicationPayload = z.infer<
  typeof createTalentApplicationBodySchema
>;
export type PatchTalentApplicationStatusPayload = z.infer<
  typeof patchTalentApplicationStatusBodySchema
>;
export type PatchTalentApplicationNotesPayload = z.infer<
  typeof patchTalentApplicationNotesBodySchema
>;

export type TalentApplicationListItem = z.infer<
  typeof talentApplicationListItemSchema
>;
export type TalentApplicationDetail = z.infer<
  typeof talentApplicationDetailSchema
>;
export type TalentApplicationCreatedResponse = {
  id: string;
  status: z.infer<typeof talentApplicationStatusSchema>;
};
