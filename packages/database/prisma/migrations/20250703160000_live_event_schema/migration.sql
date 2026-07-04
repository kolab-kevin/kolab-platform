-- CreateEnum
CREATE TYPE "LiveEventType" AS ENUM (
    'SESSION_STARTED',
    'SESSION_ENDED',
    'CHAT_MESSAGE',
    'GIFT_RECEIVED',
    'VOICE_TRANSCRIPT_SEGMENT',
    'PERFORMANCE_MOMENT',
    'SONG_STARTED',
    'SONG_ENDED',
    'DANCE_MOMENT',
    'PK_STARTED',
    'PK_ENDED',
    'COHOST_JOINED',
    'COHOST_LEFT',
    'VIEWER_JOINED',
    'VIEWER_LEFT',
    'MODERATOR_ACTION',
    'SYSTEM_EVENT',
    'OTHER'
);

-- CreateTable
CREATE TABLE "live_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "live_session_id" TEXT NOT NULL,
    "creator_profile_id" TEXT NOT NULL,
    "event_type" "LiveEventType" NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "offset_ms" INTEGER,
    "platform" "LivePlatform" NOT NULL,
    "platform_event_id" TEXT,
    "external_actor_id" TEXT,
    "actor_display_name" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "live_events_organization_id_idx" ON "live_events"("organization_id");

-- CreateIndex
CREATE INDEX "live_events_live_session_id_occurred_at_idx" ON "live_events"("live_session_id", "occurred_at");

-- CreateIndex
CREATE INDEX "live_events_live_session_id_offset_ms_idx" ON "live_events"("live_session_id", "offset_ms");

-- CreateIndex
CREATE INDEX "live_events_organization_id_creator_profile_id_occurred_at_idx" ON "live_events"("organization_id", "creator_profile_id", "occurred_at");

-- CreateIndex
CREATE INDEX "live_events_organization_id_external_actor_id_idx" ON "live_events"("organization_id", "external_actor_id");

-- CreateIndex
CREATE INDEX "live_events_organization_id_event_type_idx" ON "live_events"("organization_id", "event_type");

-- CreateIndex
CREATE INDEX "live_events_organization_id_occurred_at_idx" ON "live_events"("organization_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "live_events_organization_id_platform_platform_event_id_key" ON "live_events"("organization_id", "platform", "platform_event_id");

-- AddForeignKey
ALTER TABLE "live_events" ADD CONSTRAINT "live_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_events" ADD CONSTRAINT "live_events_live_session_id_fkey" FOREIGN KEY ("live_session_id") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_events" ADD CONSTRAINT "live_events_creator_profile_id_fkey" FOREIGN KEY ("creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
