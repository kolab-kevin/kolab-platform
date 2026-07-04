import type {
  CreatorLiveSchedule as PrismaCreatorLiveSchedule,
  LiveEvent as PrismaLiveEvent,
  LiveSession as PrismaLiveSession,
} from '@kolab/database';
import type { CreatorLiveSchedule, LiveEvent, LiveSession } from '@kolab/types';

import { toMetadataRecord } from './live-intelligence.utils';

function decimalToString(value: PrismaLiveSession['totalGiftValue']): string | null {
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
