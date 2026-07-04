import type { GifterSpendingTier, LiveEventType } from '@kolab/database';
import { Prisma } from '@kolab/database';

export const GIFTER_ROLLUP_EVENT_TYPES = [
  'GIFT_RECEIVED',
  'CHAT_MESSAGE',
  'VIEWER_JOINED',
  'VIEWER_LEFT',
] as const satisfies readonly LiveEventType[];

export type GifterRollupEventType = (typeof GIFTER_ROLLUP_EVENT_TYPES)[number];

export const GIFTER_ROLLUP_CHECKPOINT_KEY = 'gifterRollup';

export type ProfileRollupState = {
  creatorGiftValues: Record<string, number>;
  giftTypeCounts: Record<string, number>;
  countedSessions: string[];
};

export type GifterRollupCheckpoint = {
  processedEventIds: string[];
  lastProcessedAt: string | null;
};

export type LiveEventForRollup = {
  id: string;
  eventType: GifterRollupEventType;
  occurredAt: Date;
  creatorProfileId: string;
  externalActorId: string | null;
  actorDisplayName: string | null;
  payload: unknown;
};

export type GifterRollupAccumulator = {
  totalGiftCount: number;
  totalGiftValue: Prisma.Decimal;
  totalSessions: number;
  firstSeenAt: Date | null;
  lastSeenAt: Date | null;
  displayName: string | null;
  favoriteCreatorProfileId: string | null;
  favoriteGiftType: string | null;
  rollupState: ProfileRollupState;
  sessionStats: {
    giftCount: number;
    giftValue: Prisma.Decimal;
    firstGiftAt: Date | null;
    lastGiftAt: Date | null;
    firstSeenAt: Date | null;
    lastSeenAt: Date | null;
    chatMessageCount: number;
  };
  sessionGiftCountDelta: number;
  sessionGiftValueDelta: Prisma.Decimal;
};

export function createEmptyProfileRollupState(): ProfileRollupState {
  return {
    creatorGiftValues: {},
    giftTypeCounts: {},
    countedSessions: [],
  };
}

export function parseGifterRollupCheckpoint(metadata: unknown): GifterRollupCheckpoint {
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
    return { processedEventIds: [], lastProcessedAt: null };
  }

  const checkpoint = (metadata as Record<string, unknown>)[GIFTER_ROLLUP_CHECKPOINT_KEY];
  if (typeof checkpoint !== 'object' || checkpoint === null || Array.isArray(checkpoint)) {
    return { processedEventIds: [], lastProcessedAt: null };
  }

  const record = checkpoint as Record<string, unknown>;
  const processedEventIds = Array.isArray(record.processedEventIds)
    ? record.processedEventIds.filter((value): value is string => typeof value === 'string')
    : [];

  return {
    processedEventIds,
    lastProcessedAt: typeof record.lastProcessedAt === 'string' ? record.lastProcessedAt : null,
  };
}

export function parseProfileRollupState(metadata: unknown): ProfileRollupState {
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
    return createEmptyProfileRollupState();
  }

  const rollupState = (metadata as Record<string, unknown>).rollupState;
  if (typeof rollupState !== 'object' || rollupState === null || Array.isArray(rollupState)) {
    return createEmptyProfileRollupState();
  }

  const record = rollupState as Record<string, unknown>;

  return {
    creatorGiftValues: parseNumericRecord(record.creatorGiftValues),
    giftTypeCounts: parseNumericRecord(record.giftTypeCounts),
    countedSessions: Array.isArray(record.countedSessions)
      ? record.countedSessions.filter((value): value is string => typeof value === 'string')
      : [],
  };
}

export function mergeSessionMetadataCheckpoint(
  metadata: unknown,
  checkpoint: GifterRollupCheckpoint,
): Record<string, unknown> {
  const base =
    typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)
      ? { ...(metadata as Record<string, unknown>) }
      : {};

  return {
    ...base,
    [GIFTER_ROLLUP_CHECKPOINT_KEY]: checkpoint,
  };
}

export function mergeProfileRollupMetadata(
  metadata: unknown,
  rollupState: ProfileRollupState,
): Record<string, unknown> {
  const base =
    typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)
      ? { ...(metadata as Record<string, unknown>) }
      : {};

  return {
    ...base,
    rollupState,
  };
}

export function createInitialAccumulator(
  displayName: string | null,
  occurredAt: Date,
): GifterRollupAccumulator {
  return {
    totalGiftCount: 0,
    totalGiftValue: new Prisma.Decimal(0),
    totalSessions: 0,
    firstSeenAt: occurredAt,
    lastSeenAt: occurredAt,
    displayName,
    favoriteCreatorProfileId: null,
    favoriteGiftType: null,
    rollupState: createEmptyProfileRollupState(),
    sessionStats: {
      giftCount: 0,
      giftValue: new Prisma.Decimal(0),
      firstGiftAt: null,
      lastGiftAt: null,
      firstSeenAt: occurredAt,
      lastSeenAt: occurredAt,
      chatMessageCount: 0,
    },
    sessionGiftCountDelta: 0,
    sessionGiftValueDelta: new Prisma.Decimal(0),
  };
}

export function applyRollupEvent(
  accumulator: GifterRollupAccumulator,
  event: LiveEventForRollup,
  liveSessionId: string,
): GifterRollupAccumulator {
  const next: GifterRollupAccumulator = {
    ...accumulator,
    rollupState: {
      creatorGiftValues: { ...accumulator.rollupState.creatorGiftValues },
      giftTypeCounts: { ...accumulator.rollupState.giftTypeCounts },
      countedSessions: [...accumulator.rollupState.countedSessions],
    },
    sessionStats: { ...accumulator.sessionStats },
    sessionGiftCountDelta: accumulator.sessionGiftCountDelta,
    sessionGiftValueDelta: new Prisma.Decimal(accumulator.sessionGiftValueDelta),
  };

  if (event.actorDisplayName) {
    next.displayName = event.actorDisplayName;
  }

  next.firstSeenAt = minDate(next.firstSeenAt, event.occurredAt);
  next.lastSeenAt = maxDate(next.lastSeenAt, event.occurredAt);
  next.sessionStats.firstSeenAt = minDate(next.sessionStats.firstSeenAt, event.occurredAt);
  next.sessionStats.lastSeenAt = maxDate(next.sessionStats.lastSeenAt, event.occurredAt);

  if (!next.rollupState.countedSessions.includes(liveSessionId)) {
    next.rollupState.countedSessions.push(liveSessionId);
    next.totalSessions += 1;
  }

  switch (event.eventType) {
    case 'GIFT_RECEIVED': {
      const gift = parseGiftPayload(event.payload);
      next.totalGiftCount += gift.giftCount;
      next.totalGiftValue = next.totalGiftValue.add(gift.giftValue);
      next.sessionStats.giftCount += gift.giftCount;
      next.sessionStats.giftValue = next.sessionStats.giftValue.add(gift.giftValue);
      next.sessionStats.firstGiftAt = minDate(next.sessionStats.firstGiftAt, event.occurredAt);
      next.sessionStats.lastGiftAt = maxDate(next.sessionStats.lastGiftAt, event.occurredAt);
      next.sessionGiftCountDelta += gift.giftCount;
      next.sessionGiftValueDelta = next.sessionGiftValueDelta.add(gift.giftValue);

      if (gift.giftType) {
        next.rollupState.giftTypeCounts[gift.giftType] =
          (next.rollupState.giftTypeCounts[gift.giftType] ?? 0) + gift.giftCount;
      }

      const creatorGiftTotal =
        (next.rollupState.creatorGiftValues[event.creatorProfileId] ?? 0) +
        gift.giftValue.toNumber();
      next.rollupState.creatorGiftValues[event.creatorProfileId] = creatorGiftTotal;
      break;
    }
    case 'CHAT_MESSAGE':
      next.sessionStats.chatMessageCount += 1;
      break;
    case 'VIEWER_JOINED':
    case 'VIEWER_LEFT':
      break;
    default:
      break;
  }

  next.favoriteCreatorProfileId = resolveFavoriteCreator(next.rollupState.creatorGiftValues);
  next.favoriteGiftType = resolveFavoriteGiftType(next.rollupState.giftTypeCounts);

  return next;
}

export function calculateSpendingTier(totalGiftValue: Prisma.Decimal): GifterSpendingTier {
  const value = totalGiftValue.toNumber();

  if (value <= 0) {
    return 'UNKNOWN';
  }

  if (value < 100) {
    return 'LOW';
  }

  if (value < 1000) {
    return 'MEDIUM';
  }

  if (value < 10000) {
    return 'HIGH';
  }

  if (value < 50000) {
    return 'WHALE';
  }

  return 'VIP';
}

export function parseGiftPayload(payload: unknown): {
  giftType: string | null;
  giftCount: number;
  giftValue: Prisma.Decimal;
} {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return {
      giftType: null,
      giftCount: 1,
      giftValue: new Prisma.Decimal(0),
    };
  }

  const record = payload as Record<string, unknown>;
  const giftType = typeof record.giftType === 'string' ? record.giftType : null;
  const giftCount =
    typeof record.quantity === 'number' && Number.isFinite(record.quantity) && record.quantity > 0
      ? Math.floor(record.quantity)
      : 1;

  let unitValue = 0;
  if (typeof record.diamondValue === 'number' && Number.isFinite(record.diamondValue)) {
    unitValue = record.diamondValue;
  } else if (
    typeof record.currencyEquivalent === 'number' &&
    Number.isFinite(record.currencyEquivalent)
  ) {
    unitValue = record.currencyEquivalent;
  }

  return {
    giftType,
    giftCount,
    giftValue: new Prisma.Decimal(unitValue),
  };
}

function parseNumericRecord(value: unknown): Record<string, number> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }

  const result: Record<string, number> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === 'number' && Number.isFinite(entry)) {
      result[key] = entry;
    }
  }

  return result;
}

function resolveFavoriteCreator(creatorGiftValues: Record<string, number>): string | null {
  let favoriteCreatorProfileId: string | null = null;
  let highestValue = -1;

  for (const [creatorProfileId, giftValue] of Object.entries(creatorGiftValues)) {
    if (giftValue > highestValue) {
      highestValue = giftValue;
      favoriteCreatorProfileId = creatorProfileId;
    }
  }

  return favoriteCreatorProfileId;
}

function resolveFavoriteGiftType(giftTypeCounts: Record<string, number>): string | null {
  let favoriteGiftType: string | null = null;
  let highestCount = -1;

  for (const [giftType, count] of Object.entries(giftTypeCounts)) {
    if (count > highestCount) {
      highestCount = count;
      favoriteGiftType = giftType;
    }
  }

  return favoriteGiftType;
}

function minDate(current: Date | null, candidate: Date): Date {
  if (!current) {
    return candidate;
  }

  return current.getTime() <= candidate.getTime() ? current : candidate;
}

function maxDate(current: Date | null, candidate: Date): Date {
  if (!current) {
    return candidate;
  }

  return current.getTime() >= candidate.getTime() ? current : candidate;
}
