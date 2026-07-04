import type { LiveSessionStatus } from '@kolab/types';
import { BadRequestException } from '@nestjs/common';

const LIVE_SESSION_STATUS_TRANSITIONS: Record<LiveSessionStatus, LiveSessionStatus[]> = {
  SCHEDULED: ['LIVE', 'CANCELLED'],
  LIVE: ['ENDED', 'CANCELLED'],
  ENDED: [],
  CANCELLED: [],
};

export function toMetadataRecord(metadata: unknown): Record<string, unknown> {
  if (typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }

  return {};
}

export function assertAllowedLiveSessionStatusTransition(
  currentStatus: LiveSessionStatus,
  nextStatus: LiveSessionStatus,
): void {
  if (currentStatus === nextStatus) {
    throw new BadRequestException('Live session status is already set to the requested value');
  }

  const allowed = LIVE_SESSION_STATUS_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(nextStatus)) {
    throw new BadRequestException(
      `Cannot transition live session status from ${currentStatus} to ${nextStatus}`,
    );
  }
}

export function assertLiveSessionIsEditable(
  status: LiveSessionStatus,
  input: {
    campaignId?: string | null;
    platform?: string;
    platformSessionId?: string | null;
    title?: string;
    description?: string | null;
    scheduledStart?: string | null;
    scheduledEnd?: string | null;
    peakViewers?: number | null;
    totalViewers?: number | null;
    totalGifts?: number | null;
    totalGiftValue?: string | null;
    metadata?: Record<string, unknown>;
  },
): void {
  if (status === 'ENDED' || status === 'CANCELLED') {
    const hasNonMetadataUpdate = Object.entries(input).some(
      ([key, value]) => key !== 'metadata' && value !== undefined,
    );

    if (hasNonMetadataUpdate) {
      throw new BadRequestException('Ended or cancelled live sessions only allow metadata updates');
    }

    if (input.metadata === undefined) {
      throw new BadRequestException('Ended or cancelled live sessions only allow metadata updates');
    }
  }
}

export function computeDurationSeconds(startedAt: Date, endedAt: Date): number {
  return Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000));
}
