-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('BRAND_DEAL', 'LIVE_STREAM', 'TIKTOK_SHOP', 'UGC', 'AFFILIATE', 'OTHER');

-- CreateEnum
CREATE TYPE "CampaignDeliverableStatus" AS ENUM ('DRAFT', 'OPEN', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "brand_name" TEXT,
    "campaign_type" "CampaignType" NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "budget_amount" DECIMAL(12,2),
    "budget_currency" TEXT,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "application_deadline" TIMESTAMP(3),
    "brief" JSONB NOT NULL DEFAULT '{}',
    "requirements" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_deliverables" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignDeliverableStatus" NOT NULL DEFAULT 'DRAFT',
    "due_at" TIMESTAMP(3),
    "requirements" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaigns_organization_id_idx" ON "campaigns"("organization_id");

-- CreateIndex
CREATE INDEX "campaigns_organization_id_status_idx" ON "campaigns"("organization_id", "status");

-- CreateIndex
CREATE INDEX "campaigns_organization_id_campaign_type_idx" ON "campaigns"("organization_id", "campaign_type");

-- CreateIndex
CREATE INDEX "campaigns_organization_id_starts_at_idx" ON "campaigns"("organization_id", "starts_at");

-- CreateIndex
CREATE INDEX "campaigns_organization_id_ends_at_idx" ON "campaigns"("organization_id", "ends_at");

-- CreateIndex
CREATE INDEX "campaigns_created_by_user_id_idx" ON "campaigns"("created_by_user_id");

-- CreateIndex
CREATE INDEX "campaign_deliverables_organization_id_idx" ON "campaign_deliverables"("organization_id");

-- CreateIndex
CREATE INDEX "campaign_deliverables_organization_id_campaign_id_idx" ON "campaign_deliverables"("organization_id", "campaign_id");

-- CreateIndex
CREATE INDEX "campaign_deliverables_organization_id_status_idx" ON "campaign_deliverables"("organization_id", "status");

-- CreateIndex
CREATE INDEX "campaign_deliverables_campaign_id_idx" ON "campaign_deliverables"("campaign_id");

-- CreateIndex
CREATE INDEX "campaign_deliverables_campaign_id_status_idx" ON "campaign_deliverables"("campaign_id", "status");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_deliverables" ADD CONSTRAINT "campaign_deliverables_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_deliverables" ADD CONSTRAINT "campaign_deliverables_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
