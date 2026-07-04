import { z } from 'zod';

export const LivePlatformSchema = z.enum(['TIKTOK', 'BIGO', 'OTHER']);

export type LivePlatform = z.infer<typeof LivePlatformSchema>;

export const LiveSessionStatusSchema = z.enum(['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED']);

export type LiveSessionStatus = z.infer<typeof LiveSessionStatusSchema>;

const metadataSchema = z.record(z.unknown());

const isoDateTimeSchema = z.string().datetime();

const giftValueSchema = z.string().regex(/^\d+(\.\d{1,2})?$/);

const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const weekdaySchema = z.number().int().min(0).max(6);

export const LiveSessionSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  creatorProfileId: z.string(),
  campaignId: z.string().nullable(),
  platform: LivePlatformSchema,
  platformSessionId: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  startedAt: isoDateTimeSchema.nullable(),
  endedAt: isoDateTimeSchema.nullable(),
  scheduledStart: isoDateTimeSchema.nullable(),
  scheduledEnd: isoDateTimeSchema.nullable(),
  durationSeconds: z.number().int().nonnegative().nullable(),
  peakViewers: z.number().int().nonnegative().nullable(),
  totalViewers: z.number().int().nonnegative().nullable(),
  totalGifts: z.number().int().nonnegative().nullable(),
  totalGiftValue: giftValueSchema.nullable(),
  status: LiveSessionStatusSchema,
  metadata: metadataSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type LiveSession = z.infer<typeof LiveSessionSchema>;

export const CreatorLiveScheduleSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  creatorProfileId: z.string(),
  timezone: z.string(),
  recurrenceRule: z.string().nullable(),
  weekdays: z.array(weekdaySchema),
  startTime: timeOfDaySchema,
  endTime: timeOfDaySchema,
  active: z.boolean(),
  metadata: metadataSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type CreatorLiveSchedule = z.infer<typeof CreatorLiveScheduleSchema>;

export const LiveSessionListQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: LiveSessionStatusSchema.optional(),
  platform: LivePlatformSchema.optional(),
  creatorProfileId: z.string().min(1).optional(),
  campaignId: z.string().min(1).optional(),
});

export type LiveSessionListQuery = z.infer<typeof LiveSessionListQuerySchema>;

export const ListLiveSessionsResponseSchema = z.object({
  items: z.array(LiveSessionSchema),
  nextCursor: z.string().nullable(),
});

export type ListLiveSessionsResponse = z.infer<typeof ListLiveSessionsResponseSchema>;

export const CreatorLiveScheduleListQuerySchema = z.object({
  creatorProfileId: z.string().min(1).optional(),
  active: z.coerce.boolean().optional(),
});

export type CreatorLiveScheduleListQuery = z.infer<typeof CreatorLiveScheduleListQuerySchema>;

export const ListCreatorLiveSchedulesResponseSchema = z.object({
  items: z.array(CreatorLiveScheduleSchema),
});

export type ListCreatorLiveSchedulesResponse = z.infer<
  typeof ListCreatorLiveSchedulesResponseSchema
>;

const optionalNullableIsoDateTimeSchema = z.string().datetime().nullable().optional();

export const CreateLiveSessionSchema = z
  .object({
    creatorProfileId: z.string().min(1),
    campaignId: z.string().min(1).nullable().optional(),
    platform: LivePlatformSchema,
    platformSessionId: z.string().trim().min(1).max(255).nullable().optional(),
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().min(1).max(5000).nullable().optional(),
    scheduledStart: isoDateTimeSchema.nullable().optional(),
    scheduledEnd: isoDateTimeSchema.nullable().optional(),
    metadata: metadataSchema.optional(),
  })
  .strict();

export type CreateLiveSessionInput = z.infer<typeof CreateLiveSessionSchema>;

export const UpdateLiveSessionSchema = z
  .object({
    campaignId: z.string().min(1).nullable().optional(),
    platform: LivePlatformSchema.optional(),
    platformSessionId: z.string().trim().min(1).max(255).nullable().optional(),
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().min(1).max(5000).nullable().optional(),
    scheduledStart: optionalNullableIsoDateTimeSchema,
    scheduledEnd: optionalNullableIsoDateTimeSchema,
    peakViewers: z.number().int().nonnegative().nullable().optional(),
    totalViewers: z.number().int().nonnegative().nullable().optional(),
    totalGifts: z.number().int().nonnegative().nullable().optional(),
    totalGiftValue: giftValueSchema.nullable().optional(),
    metadata: metadataSchema.optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one live session field must be provided',
  });

export type UpdateLiveSessionInput = z.infer<typeof UpdateLiveSessionSchema>;

export const UpdateLiveSessionStatusSchema = z
  .object({
    status: LiveSessionStatusSchema,
    metadata: metadataSchema.optional(),
  })
  .strict();

export type UpdateLiveSessionStatusInput = z.infer<typeof UpdateLiveSessionStatusSchema>;

export const CreateCreatorLiveScheduleSchema = z
  .object({
    creatorProfileId: z.string().min(1),
    timezone: z.string().trim().min(1).max(64),
    recurrenceRule: z.string().trim().min(1).max(2048).nullable().optional(),
    weekdays: z.array(weekdaySchema).default([]),
    startTime: timeOfDaySchema,
    endTime: timeOfDaySchema,
    active: z.boolean().optional(),
    metadata: metadataSchema.optional(),
  })
  .strict();

export type CreateCreatorLiveScheduleInput = z.infer<typeof CreateCreatorLiveScheduleSchema>;

export const UpdateCreatorLiveScheduleSchema = z
  .object({
    timezone: z.string().trim().min(1).max(64).optional(),
    recurrenceRule: z.string().trim().min(1).max(2048).nullable().optional(),
    weekdays: z.array(weekdaySchema).optional(),
    startTime: timeOfDaySchema.optional(),
    endTime: timeOfDaySchema.optional(),
    active: z.boolean().optional(),
    metadata: metadataSchema.optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one live schedule field must be provided',
  });

export type UpdateCreatorLiveScheduleInput = z.infer<typeof UpdateCreatorLiveScheduleSchema>;

export const LiveEventTypeSchema = z.enum([
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
  'OTHER',
]);

export type LiveEventType = z.infer<typeof LiveEventTypeSchema>;

export const LiveEventSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  liveSessionId: z.string(),
  creatorProfileId: z.string(),
  eventType: LiveEventTypeSchema,
  occurredAt: isoDateTimeSchema,
  offsetMs: z.number().int().nonnegative().nullable(),
  platform: LivePlatformSchema,
  platformEventId: z.string().nullable(),
  externalActorId: z.string().nullable(),
  actorDisplayName: z.string().nullable(),
  payload: metadataSchema,
  metadata: metadataSchema,
  createdAt: isoDateTimeSchema,
});

export type LiveEvent = z.infer<typeof LiveEventSchema>;

export const LiveEventListQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  liveSessionId: z.string().min(1).optional(),
  creatorProfileId: z.string().min(1).optional(),
  eventType: LiveEventTypeSchema.optional(),
  platform: LivePlatformSchema.optional(),
  externalActorId: z.string().min(1).optional(),
  occurredFrom: isoDateTimeSchema.optional(),
  occurredTo: isoDateTimeSchema.optional(),
});

export type LiveEventListQuery = z.infer<typeof LiveEventListQuerySchema>;

export const ListLiveEventsResponseSchema = z.object({
  items: z.array(LiveEventSchema),
  nextCursor: z.string().nullable(),
});

export type ListLiveEventsResponse = z.infer<typeof ListLiveEventsResponseSchema>;

export const MAX_LIVE_EVENT_PAYLOAD_BYTES = 65_536;

const payloadSchema = z.record(z.unknown());

export const IngestLiveEventInputSchema = z
  .object({
    creatorProfileId: z.string().min(1),
    eventType: LiveEventTypeSchema,
    occurredAt: isoDateTimeSchema,
    offsetMs: z.number().int().nonnegative().nullable().optional(),
    platform: LivePlatformSchema.optional(),
    platformEventId: z.string().trim().min(1).max(255).nullable().optional(),
    externalActorId: z.string().trim().min(1).max(255).nullable().optional(),
    actorDisplayName: z.string().trim().min(1).max(255).nullable().optional(),
    payload: payloadSchema,
    metadata: metadataSchema.optional(),
    allowPlatformMismatch: z.boolean().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const payloadSize = JSON.stringify(data.payload).length;

    if (payloadSize > MAX_LIVE_EVENT_PAYLOAD_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Event payload exceeds maximum size of ${MAX_LIVE_EVENT_PAYLOAD_BYTES} bytes`,
        path: ['payload'],
      });
    }
  });

export type IngestLiveEventInput = z.infer<typeof IngestLiveEventInputSchema>;

export const BatchIngestLiveEventsSchema = z
  .object({
    events: z.array(IngestLiveEventInputSchema).min(1).max(100),
  })
  .strict();

export type BatchIngestLiveEventsInput = z.infer<typeof BatchIngestLiveEventsSchema>;

export const IngestLiveEventResponseSchema = z.object({
  event: LiveEventSchema,
  created: z.boolean(),
});

export type IngestLiveEventResponse = z.infer<typeof IngestLiveEventResponseSchema>;

export const BatchIngestLiveEventsResponseSchema = z.object({
  items: z.array(IngestLiveEventResponseSchema),
  createdCount: z.number().int().nonnegative(),
  duplicateCount: z.number().int().nonnegative(),
});

export type BatchIngestLiveEventsResponse = z.infer<typeof BatchIngestLiveEventsResponseSchema>;

export const SessionLiveEventListQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  eventType: LiveEventTypeSchema.optional(),
  externalActorId: z.string().min(1).optional(),
});

export type SessionLiveEventListQuery = z.infer<typeof SessionLiveEventListQuerySchema>;

export const GifterSpendingTierSchema = z.enum([
  'UNKNOWN',
  'LOW',
  'MEDIUM',
  'HIGH',
  'WHALE',
  'VIP',
]);

export type GifterSpendingTier = z.infer<typeof GifterSpendingTierSchema>;

export const GifterProfileSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  platform: LivePlatformSchema,
  externalGifterId: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  spendingTier: GifterSpendingTierSchema,
  totalGiftCount: z.number().int().nonnegative(),
  totalGiftValue: giftValueSchema,
  totalSessions: z.number().int().nonnegative(),
  firstSeenAt: isoDateTimeSchema.nullable(),
  lastSeenAt: isoDateTimeSchema.nullable(),
  favoriteCreatorProfileId: z.string().nullable(),
  favoriteGiftType: z.string().nullable(),
  triggerProfile: metadataSchema,
  retentionProfile: metadataSchema,
  metadata: metadataSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type GifterProfile = z.infer<typeof GifterProfileSchema>;

export const GifterSessionStatsSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  gifterProfileId: z.string(),
  liveSessionId: z.string(),
  creatorProfileId: z.string(),
  giftCount: z.number().int().nonnegative(),
  giftValue: giftValueSchema,
  firstGiftAt: isoDateTimeSchema.nullable(),
  lastGiftAt: isoDateTimeSchema.nullable(),
  firstSeenAt: isoDateTimeSchema.nullable(),
  lastSeenAt: isoDateTimeSchema.nullable(),
  chatMessageCount: z.number().int().nonnegative(),
  metadata: metadataSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type GifterSessionStats = z.infer<typeof GifterSessionStatsSchema>;

export const GifterProfileListQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  platform: LivePlatformSchema.optional(),
  spendingTier: GifterSpendingTierSchema.optional(),
  favoriteCreatorProfileId: z.string().min(1).optional(),
  externalGifterId: z.string().min(1).optional(),
});

export type GifterProfileListQuery = z.infer<typeof GifterProfileListQuerySchema>;

export const ListGifterProfilesResponseSchema = z.object({
  items: z.array(GifterProfileSchema),
  nextCursor: z.string().nullable(),
});

export type ListGifterProfilesResponse = z.infer<typeof ListGifterProfilesResponseSchema>;

export const GifterSessionStatsListQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  gifterProfileId: z.string().min(1).optional(),
  liveSessionId: z.string().min(1).optional(),
  creatorProfileId: z.string().min(1).optional(),
});

export type GifterSessionStatsListQuery = z.infer<typeof GifterSessionStatsListQuerySchema>;

export const ListGifterSessionStatsResponseSchema = z.object({
  items: z.array(GifterSessionStatsSchema),
  nextCursor: z.string().nullable(),
});

export type ListGifterSessionStatsResponse = z.infer<typeof ListGifterSessionStatsResponseSchema>;
