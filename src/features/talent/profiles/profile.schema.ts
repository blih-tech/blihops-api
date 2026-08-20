import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const talentProfileVisibilitySchema = z.enum(['HIDDEN', 'VISIBLE']);
export const talentAccountStatusSchema = z.enum([
  'PENDING_INVITATION',
  'ACTIVE',
  'DEACTIVATED',
]);

export const createTalentProfileBodySchema = z.strictObject({
  seniority: z.string().trim().min(1).max(80),
  englishLevel: z.string().trim().min(1).max(20),
  clientMonthlyRateEur: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid EUR amount'),
  assessmentSummary: z.string().trim().min(1).max(2000),
  internalNotes: z.string().trim().min(1).max(5000),
});

export const updateTalentProfileBodySchema = z
  .strictObject({
    seniority: z.string().trim().min(1).max(80).optional(),
    englishLevel: z.string().trim().min(1).max(20).optional(),
    clientMonthlyRateEur: z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid EUR amount')
      .optional(),
    assessmentSummary: z.string().trim().min(1).max(2000).optional(),
    internalNotes: z.string().trim().min(1).max(5000).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field');

export const talentProfileIdParamsSchema = z.object({
  id: z.string().min(1).max(50),
});

export const talentProfileListQuerySchema = z.object({
  visibility: talentProfileVisibilitySchema.optional(),
  accountStatus: talentAccountStatusSchema.optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20).optional(),
});

export const talentProfileListItemSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  primaryRole: z.string(),
  seniority: z.string(),
  englishLevel: z.string(),
  visibility: talentProfileVisibilitySchema,
  accountStatus: talentAccountStatusSchema,
  clientMonthlyRateEur: z.string(),
  isVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const talentProfileDetailSchema = talentProfileListItemSchema.extend({
  workEmail: z.string(),
  phone: z.string(),
  country: z.string(),
  city: z.string(),
  profilePhotoKey: z.string(),
  professionalHeadline: z.string(),
  shortBio: z.string(),
  techStack: z.array(z.string()),
  secondarySkills: z.array(z.string()),
  yearsExperience: z.number(),
  portfolioUrl: z.string().nullable(),
  githubUrl: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  resumeFileKey: z.string(),
  assessmentSummary: z.string(),
  internalNotes: z.string(),
  applicationId: z.string(),
});

export const talentProfileListResponseSchema = z.object({
  items: z.array(talentProfileListItemSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    totalPages: z.number(),
  }),
});

export const talentProfileDetailResponseSchema = z.object({
  data: talentProfileDetailSchema,
});

export type CreateTalentProfilePayload = z.infer<
  typeof createTalentProfileBodySchema
>;
export type UpdateTalentProfilePayload = z.infer<
  typeof updateTalentProfileBodySchema
>;
