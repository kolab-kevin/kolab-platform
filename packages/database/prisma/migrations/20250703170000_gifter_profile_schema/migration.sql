-- CreateEnum
CREATE TYPE "GifterSpendingTier" AS ENUM ('UNKNOWN', 'LOW', 'MEDIUM', 'HIGH', 'WHALE', 'VIP');

-- CreateTable
CREATE TABLE "gifter_profiles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "platform" "LivePlatform" NOT NULL,
    "external_gifter_id" TEXT NOT NULL,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "spending_tier" "GifterSpendingTier" NOT NULL DEFAULT 'UNKNOWN',
    "total_gift_count" INTEGER NOT NULL DEFAULT 0,
    "total_gift_value" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_sessions" INTEGER NOT NULL DEFAULT 0,
    "first_seen_at" TIMESTAMP(3),
    "last_seen_at" TIMESTAMP(3),
    "favorite_creator_profile_id" TEXT,
    "favorite_gift_type" TEXT,
    "trigger_profile" JSONB NOT NULL DEFAULT '{}',
    "retention_profile" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gifter_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gifter_session_stats" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "gifter_profile_id" TEXT NOT NULL,
    "live_session_id" TEXT NOT NULL,
    "creator_profile_id" TEXT NOT NULL,
    "gift_count" INTEGER NOT NULL DEFAULT 0,
    "gift_value" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "first_gift_at" TIMESTAMP(3),
    "last_gift_at" TIMESTAMP(3),
    "first_seen_at" TIMESTAMP(3),
    "last_seen_at" TIMESTAMP(3),
    "chat_message_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gifter_session_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gifter_profiles_organization_id_idx" ON "gifter_profiles"("organization_id");

-- CreateIndex
CREATE INDEX "gifter_profiles_organization_id_platform_idx" ON "gifter_profiles"("organization_id", "platform");

-- CreateIndex
CREATE INDEX "gifter_profiles_organization_id_external_gifter_id_idx" ON "gifter_profiles"("organization_id", "external_gifter_id");

-- CreateIndex
CREATE INDEX "gifter_profiles_organization_id_spending_tier_idx" ON "gifter_profiles"("organization_id", "spending_tier");

-- CreateIndex
CREATE INDEX "gifter_profiles_organization_id_favorite_creator_profile_id_idx" ON "gifter_profiles"("organization_id", "favorite_creator_profile_id");

-- CreateIndex
CREATE INDEX "gifter_profiles_organization_id_last_seen_at_idx" ON "gifter_profiles"("organization_id", "last_seen_at");

-- CreateIndex
CREATE UNIQUE INDEX "gifter_profiles_organization_id_platform_external_gifter_id_key" ON "gifter_profiles"("organization_id", "platform", "external_gifter_id");

-- CreateIndex
CREATE INDEX "gifter_session_stats_organization_id_idx" ON "gifter_session_stats"("organization_id");

-- CreateIndex
CREATE INDEX "gifter_session_stats_organization_id_gifter_profile_id_idx" ON "gifter_session_stats"("organization_id", "gifter_profile_id");

-- CreateIndex
CREATE INDEX "gifter_session_stats_organization_id_live_session_id_idx" ON "gifter_session_stats"("organization_id", "live_session_id");

-- CreateIndex
CREATE INDEX "gifter_session_stats_organization_id_creator_profile_id_idx" ON "gifter_session_stats"("organization_id", "creator_profile_id");

-- CreateIndex
CREATE INDEX "gifter_session_stats_live_session_id_idx" ON "gifter_session_stats"("live_session_id");

-- CreateIndex
CREATE INDEX "gifter_session_stats_creator_profile_id_idx" ON "gifter_session_stats"("creator_profile_id");

-- CreateIndex
CREATE INDEX "gifter_session_stats_gifter_profile_id_idx" ON "gifter_session_stats"("gifter_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "gifter_session_stats_gifter_profile_id_live_session_id_key" ON "gifter_session_stats"("gifter_profile_id", "live_session_id");

-- AddForeignKey
ALTER TABLE "gifter_profiles" ADD CONSTRAINT "gifter_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifter_profiles" ADD CONSTRAINT "gifter_profiles_favorite_creator_profile_id_fkey" FOREIGN KEY ("favorite_creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifter_session_stats" ADD CONSTRAINT "gifter_session_stats_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifter_session_stats" ADD CONSTRAINT "gifter_session_stats_gifter_profile_id_fkey" FOREIGN KEY ("gifter_profile_id") REFERENCES "gifter_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifter_session_stats" ADD CONSTRAINT "gifter_session_stats_live_session_id_fkey" FOREIGN KEY ("live_session_id") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifter_session_stats" ADD CONSTRAINT "gifter_session_stats_creator_profile_id_fkey" FOREIGN KEY ("creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
