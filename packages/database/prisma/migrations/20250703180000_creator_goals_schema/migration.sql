-- CreateEnum
CREATE TYPE "CreatorGoalType" AS ENUM (
  'LIVE_HOURS',
  'LIVE_DAYS',
  'DIAMONDS',
  'GIFT_VALUE',
  'CAMPAIGN_DELIVERABLES',
  'PERFORMANCE_SCORE',
  'COMPLIANCE',
  'WHALE_RETENTION',
  'REPEAT_GIFTERS',
  'CONSISTENCY_SCORE'
);

-- CreateEnum
CREATE TYPE "CreatorGoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'MISSED', 'CANCELLED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "creator_goals" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "creator_profile_id" TEXT NOT NULL,
    "goal_type" "CreatorGoalType" NOT NULL,
    "status" "CreatorGoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT,
    "target_value" DECIMAL(14,2) NOT NULL,
    "current_value" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_goal_progress" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "creator_goal_id" TEXT NOT NULL,
    "current_value" DECIMAL(14,2) NOT NULL,
    "target_value" DECIMAL(14,2) NOT NULL,
    "progress_percent" INTEGER NOT NULL,
    "calculation_summary" JSONB NOT NULL DEFAULT '{}',
    "recalculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_goal_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "creator_goals_organization_id_idx" ON "creator_goals"("organization_id");

-- CreateIndex
CREATE INDEX "creator_goals_organization_id_creator_profile_id_idx" ON "creator_goals"("organization_id", "creator_profile_id");

-- CreateIndex
CREATE INDEX "creator_goals_organization_id_status_idx" ON "creator_goals"("organization_id", "status");

-- CreateIndex
CREATE INDEX "creator_goals_creator_profile_id_idx" ON "creator_goals"("creator_profile_id");

-- CreateIndex
CREATE INDEX "creator_goals_creator_profile_id_status_idx" ON "creator_goals"("creator_profile_id", "status");

-- CreateIndex
CREATE INDEX "creator_goals_creator_profile_id_goal_type_idx" ON "creator_goals"("creator_profile_id", "goal_type");

-- CreateIndex
CREATE INDEX "creator_goal_progress_organization_id_idx" ON "creator_goal_progress"("organization_id");

-- CreateIndex
CREATE INDEX "creator_goal_progress_creator_goal_id_idx" ON "creator_goal_progress"("creator_goal_id");

-- CreateIndex
CREATE INDEX "creator_goal_progress_creator_goal_id_recalculated_at_idx" ON "creator_goal_progress"("creator_goal_id", "recalculated_at");

-- AddForeignKey
ALTER TABLE "creator_goals" ADD CONSTRAINT "creator_goals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_goals" ADD CONSTRAINT "creator_goals_creator_profile_id_fkey" FOREIGN KEY ("creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_goals" ADD CONSTRAINT "creator_goals_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_goal_progress" ADD CONSTRAINT "creator_goal_progress_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_goal_progress" ADD CONSTRAINT "creator_goal_progress_creator_goal_id_fkey" FOREIGN KEY ("creator_goal_id") REFERENCES "creator_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
