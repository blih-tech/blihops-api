-- CreateEnum
CREATE TYPE "TalentApplicationStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'SCREENING', 'TECHNICAL_ASSESSMENT', 'ENGLISH_ASSESSMENT', 'REMOTE_READINESS_ASSESSMENT', 'APPROVED', 'COMPLETION_REQUESTED', 'COMPLETION_SUBMITTED', 'PROFILE_CREATED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProfileCompletionRequestStatus" AS ENUM ('PENDING', 'SUBMITTED', 'EXPIRED', 'REPLACED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REPLACED');

-- CreateEnum
CREATE TYPE "TalentAccountStatus" AS ENUM ('PENDING_INVITATION', 'ACTIVE', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "TalentProfileVisibility" AS ENUM ('HIDDEN', 'VISIBLE');

-- CreateTable
CREATE TABLE "TalentApplication" (
    "id" TEXT NOT NULL,
    "status" "TalentApplicationStatus" NOT NULL DEFAULT 'NEW',
    "fullName" TEXT NOT NULL,
    "workEmail" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "primaryRole" TEXT NOT NULL,
    "techStack" TEXT[],
    "secondarySkills" TEXT[],
    "yearsExperience" INTEGER NOT NULL,
    "portfolioUrl" TEXT,
    "githubUrl" TEXT,
    "linkedinUrl" TEXT,
    "resumeFileKey" TEXT NOT NULL,
    "completionPhotoKey" TEXT,
    "completionShortBio" TEXT,
    "completionProfessionalHeadline" TEXT,
    "completionSubmittedAt" TIMESTAMP(3),
    "internalNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileCompletionRequest" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "ProfileCompletionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "tokenHash" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "replacedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileCompletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentProfile" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "workEmail" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "profilePhotoKey" TEXT NOT NULL,
    "professionalHeadline" TEXT NOT NULL,
    "shortBio" TEXT NOT NULL,
    "primaryRole" TEXT NOT NULL,
    "techStack" TEXT[],
    "secondarySkills" TEXT[],
    "yearsExperience" INTEGER NOT NULL,
    "portfolioUrl" TEXT,
    "githubUrl" TEXT,
    "linkedinUrl" TEXT,
    "resumeFileKey" TEXT NOT NULL,
    "seniority" TEXT NOT NULL,
    "englishLevel" TEXT NOT NULL,
    "clientMonthlyRateEur" DECIMAL(12,2) NOT NULL,
    "assessmentSummary" TEXT NOT NULL,
    "internalNotes" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "visibility" "TalentProfileVisibility" NOT NULL DEFAULT 'HIDDEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "talentProfileId" TEXT NOT NULL,
    "status" "TalentAccountStatus" NOT NULL DEFAULT 'PENDING_INVITATION',
    "invitedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "deactivatedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentInvitation" (
    "id" TEXT NOT NULL,
    "talentAccountId" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "replacedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TalentApplication_status_idx" ON "TalentApplication"("status");

-- CreateIndex
CREATE INDEX "TalentApplication_workEmail_idx" ON "TalentApplication"("workEmail");

-- CreateIndex
CREATE INDEX "TalentApplication_createdAt_idx" ON "TalentApplication"("createdAt");

-- CreateIndex
CREATE INDEX "ProfileCompletionRequest_applicationId_status_idx" ON "ProfileCompletionRequest"("applicationId", "status");

-- CreateIndex
CREATE INDEX "ProfileCompletionRequest_expiresAt_idx" ON "ProfileCompletionRequest"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TalentProfile_applicationId_key" ON "TalentProfile"("applicationId");

-- CreateIndex
CREATE INDEX "TalentProfile_visibility_idx" ON "TalentProfile"("visibility");

-- CreateIndex
CREATE INDEX "TalentProfile_primaryRole_idx" ON "TalentProfile"("primaryRole");

-- CreateIndex
CREATE INDEX "TalentProfile_seniority_idx" ON "TalentProfile"("seniority");

-- CreateIndex
CREATE INDEX "TalentProfile_englishLevel_idx" ON "TalentProfile"("englishLevel");

-- CreateIndex
CREATE INDEX "TalentProfile_createdAt_idx" ON "TalentProfile"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TalentAccount_userId_key" ON "TalentAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TalentAccount_talentProfileId_key" ON "TalentAccount"("talentProfileId");

-- CreateIndex
CREATE INDEX "TalentAccount_status_idx" ON "TalentAccount"("status");

-- CreateIndex
CREATE INDEX "TalentInvitation_talentAccountId_status_idx" ON "TalentInvitation"("talentAccountId", "status");

-- CreateIndex
CREATE INDEX "TalentInvitation_expiresAt_idx" ON "TalentInvitation"("expiresAt");

-- AddForeignKey
ALTER TABLE "ProfileCompletionRequest" ADD CONSTRAINT "ProfileCompletionRequest_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "TalentApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentProfile" ADD CONSTRAINT "TalentProfile_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "TalentApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentAccount" ADD CONSTRAINT "TalentAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentAccount" ADD CONSTRAINT "TalentAccount_talentProfileId_fkey" FOREIGN KEY ("talentProfileId") REFERENCES "TalentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentInvitation" ADD CONSTRAINT "TalentInvitation_talentAccountId_fkey" FOREIGN KEY ("talentAccountId") REFERENCES "TalentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
