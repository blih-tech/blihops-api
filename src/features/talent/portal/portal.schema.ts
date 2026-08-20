import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const optionalUrl = z.union([z.literal(''), z.string().trim().url().max(300)]);

export const updateTalentPortalBodySchema = z
  .strictObject({
    professionalHeadline: z.string().trim().min(2).max(120).optional(),
    shortBio: z.string().trim().min(10).max(1000).optional(),
    primaryRole: z.string().trim().min(1).max(80).optional(),
    techStack: z
      .array(z.string().trim().min(1).max(50))
      .min(1)
      .max(30)
      .optional(),
    secondarySkills: z
      .array(z.string().trim().min(1).max(50))
      .max(30)
      .optional(),
    yearsExperience: z.coerce.number().int().min(0).max(50).optional(),
    portfolioUrl: optionalUrl.optional(),
    githubUrl: optionalUrl.optional(),
    linkedinUrl: optionalUrl.optional(),
    profilePhotoKey: z.string().trim().min(1).max(500).optional(),
    resumeFileKey: z.string().trim().min(1).max(500).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field');

export const talentMeResponseSchema = z.object({
  data: z.object({
    user: z.object({ id: z.string(), name: z.string(), email: z.string() }),
    talentAccount: z.object({ id: z.string(), status: z.string() }),
    talentProfile: z.object({
      id: z.string(),
      visibility: z.string(),
      isVerified: z.boolean(),
    }),
  }),
});

export const talentPortalDetailSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  workEmail: z.string(),
  phone: z.string(),
  country: z.string(),
  city: z.string(),
  profilePhotoKey: z.string(),
  professionalHeadline: z.string(),
  shortBio: z.string(),
  primaryRole: z.string(),
  techStack: z.array(z.string()),
  secondarySkills: z.array(z.string()),
  yearsExperience: z.number(),
  portfolioUrl: z.string().nullable(),
  githubUrl: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  resumeFileKey: z.string(),
  seniority: z.string(),
  englishLevel: z.string(),
  clientMonthlyRateEur: z.string(),
  isVerified: z.boolean(),
  visibility: z.string(),
  accountStatus: z.string(),
});

export const talentPortalDetailResponseSchema = z.object({
  data: talentPortalDetailSchema,
});

export type UpdateTalentPortalPayload = z.infer<
  typeof updateTalentPortalBodySchema
>;
