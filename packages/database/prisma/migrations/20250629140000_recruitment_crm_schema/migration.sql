-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'INTERESTED', 'APPLICATION', 'CONTRACT_SENT', 'SIGNED', 'ACTIVE_CREATOR', 'INACTIVE', 'REJECTED');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('MANUAL', 'REFERRAL', 'SOCIAL', 'EVENT', 'IMPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "PlatformType" AS ENUM ('TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'FACEBOOK', 'TWITCH', 'OTHER');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('CALL', 'WHATSAPP', 'TIKTOK', 'FACEBOOK', 'EMAIL', 'MEETING', 'OTHER');

-- CreateEnum
CREATE TYPE "CommissionPlan" AS ENUM ('STANDARD', 'PREMIUM', 'CUSTOM');

-- CreateEnum
CREATE TYPE "LeadPlatformAccountStatus" AS ENUM ('ACTIVE', 'UNVERIFIED', 'SUSPENDED', 'REMOVED');

-- CreateTable
CREATE TABLE "creator_leads" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "country" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" "LeadSource" NOT NULL DEFAULT 'MANUAL',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "score" INTEGER NOT NULL DEFAULT 0,
    "assigned_recruiter_id" TEXT,
    "assigned_at" TIMESTAMP(3),
    "next_follow_up_at" TIMESTAMP(3),
    "commission_plan" "CommissionPlan" NOT NULL DEFAULT 'STANDARD',
    "converted_user_id" TEXT,
    "converted_at" TIMESTAMP(3),
    "notes_summary" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_platform_accounts" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "platform" "PlatformType" NOT NULL,
    "username" TEXT NOT NULL,
    "profile_url" TEXT,
    "followers" INTEGER,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "LeadPlatformAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_platform_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_assignments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "recruiter_id" TEXT NOT NULL,
    "assigned_by_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassigned_at" TIMESTAMP(3),
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_notes" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "contact_type" "ContactType" NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_status_history" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "previous_status" "LeadStatus",
    "new_status" "LeadStatus" NOT NULL,
    "changed_by_id" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "lead_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "creator_leads_organization_id_status_next_follow_up_at_idx" ON "creator_leads"("organization_id", "status", "next_follow_up_at");

-- CreateIndex
CREATE INDEX "creator_leads_organization_id_assigned_recruiter_id_status_idx" ON "creator_leads"("organization_id", "assigned_recruiter_id", "status");

-- CreateIndex
CREATE INDEX "creator_leads_organization_id_created_at_idx" ON "creator_leads"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "creator_leads_organization_id_email_key" ON "creator_leads"("organization_id", "email");

-- CreateIndex
CREATE INDEX "lead_platform_accounts_lead_id_idx" ON "lead_platform_accounts"("lead_id");

-- CreateIndex
CREATE INDEX "lead_platform_accounts_organization_id_platform_idx" ON "lead_platform_accounts"("organization_id", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "lead_platform_accounts_organization_id_platform_username_key" ON "lead_platform_accounts"("organization_id", "platform", "username");

-- CreateIndex
CREATE INDEX "lead_assignments_organization_id_lead_id_assigned_at_idx" ON "lead_assignments"("organization_id", "lead_id", "assigned_at" DESC);

-- CreateIndex
CREATE INDEX "lead_assignments_lead_id_unassigned_at_idx" ON "lead_assignments"("lead_id", "unassigned_at");

-- CreateIndex
CREATE INDEX "lead_assignments_recruiter_id_unassigned_at_idx" ON "lead_assignments"("recruiter_id", "unassigned_at");

-- CreateIndex
CREATE INDEX "lead_notes_lead_id_created_at_idx" ON "lead_notes"("lead_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "lead_notes_organization_id_created_at_idx" ON "lead_notes"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "lead_notes_author_id_created_at_idx" ON "lead_notes"("author_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "lead_status_history_lead_id_changed_at_idx" ON "lead_status_history"("lead_id", "changed_at" DESC);

-- CreateIndex
CREATE INDEX "lead_status_history_organization_id_changed_at_idx" ON "lead_status_history"("organization_id", "changed_at" DESC);

-- AddForeignKey
ALTER TABLE "creator_leads" ADD CONSTRAINT "creator_leads_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_leads" ADD CONSTRAINT "creator_leads_assigned_recruiter_id_fkey" FOREIGN KEY ("assigned_recruiter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_leads" ADD CONSTRAINT "creator_leads_converted_user_id_fkey" FOREIGN KEY ("converted_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_platform_accounts" ADD CONSTRAINT "lead_platform_accounts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_platform_accounts" ADD CONSTRAINT "lead_platform_accounts_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "creator_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "creator_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "creator_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_status_history" ADD CONSTRAINT "lead_status_history_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_status_history" ADD CONSTRAINT "lead_status_history_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "creator_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_status_history" ADD CONSTRAINT "lead_status_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
