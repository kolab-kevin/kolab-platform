-- CreateEnum
CREATE TYPE "CampaignApplicationStatus" AS ENUM ('INVITED', 'APPLIED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CampaignApplicationSource" AS ENUM ('INVITE', 'CREATOR_APPLIED', 'MANUAL');

-- CreateTable
CREATE TABLE "campaign_applications" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "creator_profile_id" TEXT NOT NULL,
    "status" "CampaignApplicationStatus" NOT NULL DEFAULT 'INVITED',
    "source" "CampaignApplicationSource" NOT NULL,
    "message" TEXT,
    "invited_by_user_id" TEXT,
    "applied_at" TIMESTAMP(3),
    "reviewed_by_user_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "decision_reason" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaign_applications_organization_id_idx" ON "campaign_applications"("organization_id");

-- CreateIndex
CREATE INDEX "campaign_applications_organization_id_campaign_id_idx" ON "campaign_applications"("organization_id", "campaign_id");

-- CreateIndex
CREATE INDEX "campaign_applications_organization_id_status_idx" ON "campaign_applications"("organization_id", "status");

-- CreateIndex
CREATE INDEX "campaign_applications_campaign_id_idx" ON "campaign_applications"("campaign_id");

-- CreateIndex
CREATE INDEX "campaign_applications_campaign_id_status_idx" ON "campaign_applications"("campaign_id", "status");

-- CreateIndex
CREATE INDEX "campaign_applications_creator_profile_id_idx" ON "campaign_applications"("creator_profile_id");

-- CreateIndex
CREATE INDEX "campaign_applications_campaign_id_creator_profile_id_idx" ON "campaign_applications"("campaign_id", "creator_profile_id");

-- Partial unique index: one active application per campaign + creator
CREATE UNIQUE INDEX "campaign_applications_active_campaign_creator_key" ON "campaign_applications"("campaign_id", "creator_profile_id") WHERE "status" IN ('INVITED', 'APPLIED');

-- AddForeignKey
ALTER TABLE "campaign_applications" ADD CONSTRAINT "campaign_applications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_applications" ADD CONSTRAINT "campaign_applications_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_applications" ADD CONSTRAINT "campaign_applications_creator_profile_id_fkey" FOREIGN KEY ("creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_applications" ADD CONSTRAINT "campaign_applications_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_applications" ADD CONSTRAINT "campaign_applications_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
