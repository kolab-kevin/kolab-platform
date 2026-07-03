-- CreateEnum
CREATE TYPE "CampaignAssignmentStatus" AS ENUM ('ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CampaignCreatorDeliverableStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "campaign_creator_assignments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "creator_profile_id" TEXT NOT NULL,
    "application_id" TEXT,
    "status" "CampaignAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "assigned_by_user_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_creator_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_creator_deliverables" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "campaign_deliverable_id" TEXT NOT NULL,
    "status" "CampaignCreatorDeliverableStatus" NOT NULL DEFAULT 'ASSIGNED',
    "due_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "submission_url" TEXT,
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_creator_deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campaign_creator_assignments_application_id_key" ON "campaign_creator_assignments"("application_id");

-- CreateIndex
CREATE INDEX "campaign_creator_assignments_organization_id_idx" ON "campaign_creator_assignments"("organization_id");

-- CreateIndex
CREATE INDEX "campaign_creator_assignments_organization_id_campaign_id_idx" ON "campaign_creator_assignments"("organization_id", "campaign_id");

-- CreateIndex
CREATE INDEX "campaign_creator_assignments_organization_id_status_idx" ON "campaign_creator_assignments"("organization_id", "status");

-- CreateIndex
CREATE INDEX "campaign_creator_assignments_campaign_id_idx" ON "campaign_creator_assignments"("campaign_id");

-- CreateIndex
CREATE INDEX "campaign_creator_assignments_campaign_id_status_idx" ON "campaign_creator_assignments"("campaign_id", "status");

-- CreateIndex
CREATE INDEX "campaign_creator_assignments_creator_profile_id_idx" ON "campaign_creator_assignments"("creator_profile_id");

-- CreateIndex
CREATE INDEX "campaign_creator_assignments_campaign_id_creator_profile_id_idx" ON "campaign_creator_assignments"("campaign_id", "creator_profile_id");

-- Partial unique index: one active assignment per campaign + creator
CREATE UNIQUE INDEX "campaign_creator_assignments_active_campaign_creator_key" ON "campaign_creator_assignments"("campaign_id", "creator_profile_id") WHERE "status" IN ('ASSIGNED', 'ACCEPTED', 'IN_PROGRESS');

-- CreateIndex
CREATE UNIQUE INDEX "campaign_creator_deliverables_assignment_id_campaign_deliverable_id_key" ON "campaign_creator_deliverables"("assignment_id", "campaign_deliverable_id");

-- CreateIndex
CREATE INDEX "campaign_creator_deliverables_organization_id_idx" ON "campaign_creator_deliverables"("organization_id");

-- CreateIndex
CREATE INDEX "campaign_creator_deliverables_organization_id_assignment_id_idx" ON "campaign_creator_deliverables"("organization_id", "assignment_id");

-- CreateIndex
CREATE INDEX "campaign_creator_deliverables_organization_id_status_idx" ON "campaign_creator_deliverables"("organization_id", "status");

-- CreateIndex
CREATE INDEX "campaign_creator_deliverables_assignment_id_idx" ON "campaign_creator_deliverables"("assignment_id");

-- CreateIndex
CREATE INDEX "campaign_creator_deliverables_assignment_id_status_idx" ON "campaign_creator_deliverables"("assignment_id", "status");

-- CreateIndex
CREATE INDEX "campaign_creator_deliverables_campaign_deliverable_id_idx" ON "campaign_creator_deliverables"("campaign_deliverable_id");

-- AddForeignKey
ALTER TABLE "campaign_creator_assignments" ADD CONSTRAINT "campaign_creator_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_creator_assignments" ADD CONSTRAINT "campaign_creator_assignments_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_creator_assignments" ADD CONSTRAINT "campaign_creator_assignments_creator_profile_id_fkey" FOREIGN KEY ("creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_creator_assignments" ADD CONSTRAINT "campaign_creator_assignments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "campaign_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_creator_assignments" ADD CONSTRAINT "campaign_creator_assignments_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_creator_deliverables" ADD CONSTRAINT "campaign_creator_deliverables_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_creator_deliverables" ADD CONSTRAINT "campaign_creator_deliverables_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "campaign_creator_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_creator_deliverables" ADD CONSTRAINT "campaign_creator_deliverables_campaign_deliverable_id_fkey" FOREIGN KEY ("campaign_deliverable_id") REFERENCES "campaign_deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
