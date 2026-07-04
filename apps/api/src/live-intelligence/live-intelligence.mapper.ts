import type {
  CreatorLiveSchedule as PrismaCreatorLiveSchedule,
  GifterProfile as PrismaGifterProfile,
  GifterSessionStats as PrismaGifterSessionStats,
  LiveEvent as PrismaLiveEvent,
  LiveSession as PrismaLiveSession,
} from '@kolab/database';
import type {
  CreatorLiveSchedule,
  FavoriteCreatorSummary,
  GifterProfile,
  GifterSessionStats,
  LiveEvent,
  LiveSession,
} from '@kolab/types';

import { toMetadataRecord } from './live-intelligence.utils';
import { sanitizeAggregateMetadata } from './live-intelligence-gifters.utils';

function decimalToString(
  value: PrismaLiveSession['totalGiftValue'] | PrismaGifterProfile['totalGiftValue'],
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return value.toString();
}

export function toLiveSession(session: PrismaLiveSession): LiveSession {
  return {
    id: session.id,
    organizationId: session.organizationId,
    creatorProfileId: session.creatorProfileId,
    campaignId: session.campaignId,
    platform: session.platform as LiveSession['platform'],
    platformSessionId: session.platformSessionId,
    title: session.title,
    description: session.description,
    startedAt: session.startedAt?.toISOString() ?? null,
    endedAt: session.endedAt?.toISOString() ?? null,
    scheduledStart: session.scheduledStart?.toISOString() ?? null,
    scheduledEnd: session.scheduledEnd?.toISOString() ?? null,
    durationSeconds: session.durationSeconds,
    peakViewers: session.peakViewers,
    totalViewers: session.totalViewers,
    totalGifts: session.totalGifts,
    totalGiftValue: decimalToString(session.totalGiftValue),
    status: session.status as LiveSession['status'],
    metadata: toMetadataRecord(session.metadata),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

export function toCreatorLiveSchedule(schedule: PrismaCreatorLiveSchedule): CreatorLiveSchedule {
  return {
    id: schedule.id,
    organizationId: schedule.organizationId,
    creatorProfileId: schedule.creatorProfileId,
    timezone: schedule.timezone,
    recurrenceRule: schedule.recurrenceRule,
    weekdays: schedule.weekdays,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    active: schedule.active,
    metadata: toMetadataRecord(schedule.metadata),
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
  };
}

export function toLiveEvent(event: PrismaLiveEvent): LiveEvent {
  return {
    id: event.id,
    organizationId: event.organizationId,
    liveSessionId: event.liveSessionId,
    creatorProfileId: event.creatorProfileId,
    eventType: event.eventType as LiveEvent['eventType'],
    occurredAt: event.occurredAt.toISOString(),
    offsetMs: event.offsetMs,
    platform: event.platform as LiveEvent['platform'],
    platformEventId: event.platformEventId,
    externalActorId: event.externalActorId,
    actorDisplayName: event.actorDisplayName,
    payload: toMetadataRecord(event.payload),
    metadata: toMetadataRecord(event.metadata),
    createdAt: event.createdAt.toISOString(),
  };
}

export function toGifterProfile(profile: PrismaGifterProfile): GifterProfile {
  return {
    id: profile.id,
    organizationId: profile.organizationId,
    platform: profile.platform as GifterProfile['platform'],
    externalGifterId: profile.externalGifterId,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    spendingTier: profile.spendingTier as GifterProfile['spendingTier'],
    totalGiftCount: profile.totalGiftCount,
    totalGiftValue: decimalToString(profile.totalGiftValue) ?? '0',
    totalSessions: profile.totalSessions,
    firstSeenAt: profile.firstSeenAt?.toISOString() ?? null,
    lastSeenAt: profile.lastSeenAt?.toISOString() ?? null,
    favoriteCreatorProfileId: profile.favoriteCreatorProfileId,
    favoriteGiftType: profile.favoriteGiftType,
    triggerProfile: sanitizeAggregateMetadata(profile.triggerProfile),
    retentionProfile: sanitizeAggregateMetadata(profile.retentionProfile),
    metadata: sanitizeAggregateMetadata(profile.metadata),
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export function toGifterSessionStats(stats: PrismaGifterSessionStats): GifterSessionStats {
  return {
    id: stats.id,
    organizationId: stats.organizationId,
    gifterProfileId: stats.gifterProfileId,
    liveSessionId: stats.liveSessionId,
    creatorProfileId: stats.creatorProfileId,
    giftCount: stats.giftCount,
    giftValue: decimalToString(stats.giftValue) ?? '0',
    firstGiftAt: stats.firstGiftAt?.toISOString() ?? null,
    lastGiftAt: stats.lastGiftAt?.toISOString() ?? null,
    firstSeenAt: stats.firstSeenAt?.toISOString() ?? null,
    lastSeenAt: stats.lastSeenAt?.toISOString() ?? null,
    chatMessageCount: stats.chatMessageCount,
    metadata: sanitizeAggregateMetadata(stats.metadata),
    createdAt: stats.createdAt.toISOString(),
    updatedAt: stats.updatedAt.toISOString(),
  };
}

export function toFavoriteCreatorSummary(
  creatorProfile: { id: string; displayName: string } | null | undefined,
): FavoriteCreatorSummary {
  if (!creatorProfile) {
    return null;
  }

  return {
    creatorProfileId: creatorProfile.id,
    displayName: creatorProfile.displayName,
  };
}
