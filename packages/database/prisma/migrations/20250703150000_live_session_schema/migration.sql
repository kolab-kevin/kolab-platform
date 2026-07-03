-- CreateEnum
CREATE TYPE "LivePlatform" AS ENUM ('TIKTOK', 'BIGO', 'OTHER');

-- CreateEnum
CREATE TYPE "LiveSessionStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');

-- CreateTable
CREATE TABLE "live_sessions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "creator_profile_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "platform" "LivePlatform" NOT NULL,
    "platform_session_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "scheduled_start" TIMESTAMP(3),
    "scheduled_end" TIMESTAMP(3),
    "duration_seconds" INTEGER,
    "peak_viewers" INTEGER,
    "total_viewers" INTEGER,
    "total_gifts" INTEGER,
    "total_gift_value" DECIMAL(14,2),
    "status" "LiveSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_live_schedules" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "creator_profile_id" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "recurrence_rule" TEXT,
    "weekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_live_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "live_sessions_organization_id_idx" ON "live_sessions"("organization_id");

-- CreateIndex
CREATE INDEX "live_sessions_organization_id_creator_profile_id_idx" ON "live_sessions"("organization_id", "creator_profile_id");

-- CreateIndex
CREATE INDEX "live_sessions_organization_id_status_idx" ON "live_sessions"("organization_id", "status");

-- CreateIndex
CREATE INDEX "live_sessions_organization_id_platform_idx" ON "live_sessions"("organization_id", "platform");

-- CreateIndex
CREATE INDEX "live_sessions_organization_id_scheduled_start_idx" ON "live_sessions"("organization_id", "scheduled_start");

-- CreateIndex
CREATE INDEX "live_sessions_organization_id_started_at_idx" ON "live_sessions"("organization_id", "started_at");

-- CreateIndex
CREATE INDEX "live_sessions_creator_profile_id_idx" ON "live_sessions"("creator_profile_id");

-- CreateIndex
CREATE INDEX "live_sessions_campaign_id_idx" ON "live_sessions"("campaign_id");

-- CreateIndex
CREATE INDEX "live_sessions_platform_session_id_idx" ON "live_sessions"("platform_session_id");

-- CreateIndex
CREATE INDEX "creator_live_schedules_organization_id_idx" ON "creator_live_schedules"("organization_id");

-- CreateIndex
CREATE INDEX "creator_live_schedules_organization_id_creator_profile_id_idx" ON "creator_live_schedules"("organization_id", "creator_profile_id");

-- CreateIndex
CREATE INDEX "creator_live_schedules_organization_id_active_idx" ON "creator_live_schedules"("organization_id", "active");

-- CreateIndex
CREATE INDEX "creator_live_schedules_creator_profile_id_idx" ON "creator_live_schedules"("creator_profile_id");

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_creator_profile_id_fkey" FOREIGN KEY ("creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_live_schedules" ADD CONSTRAINT "creator_live_schedules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_live_schedules" ADD CONSTRAINT "creator_live_schedules_creator_profile_id_fkey" FOREIGN KEY ("creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
