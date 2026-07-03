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
