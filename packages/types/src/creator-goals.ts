import { z } from 'zod';

const metadataSchema = z.record(z.unknown());
const isoDateTimeSchema = z.string().datetime();
const goalValueSchema = z.number().nonnegative().max(9999999999.99);

export const CreatorGoalTypeSchema = z.enum([
  'LIVE_HOURS',
  'LIVE_DAYS',
  'DIAMONDS',
  'GIFT_VALUE',
  'CAMPAIGN_DELIVERABLES',
  'PERFORMANCE_SCORE',
  'COMPLIANCE',
  'WHALE_RETENTION',
  'REPEAT_GIFTERS',
  'CONSISTENCY_SCORE',
]);

export type CreatorGoalType = z.infer<typeof CreatorGoalTypeSchema>;

export const CreatorGoalStatusSchema = z.enum([
  'ACTIVE',
  'COMPLETED',
  'MISSED',
  'CANCELLED',
  'ARCHIVED',
]);

export type CreatorGoalStatus = z.infer<typeof CreatorGoalStatusSchema>;

export const CreatorGoalSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  creatorProfileId: z.string(),
  goalType: CreatorGoalTypeSchema,
  status: CreatorGoalStatusSchema,
  title: z.string().nullable(),
  targetValue: z.string(),
  currentValue: z.string(),
  periodStart: isoDateTimeSchema,
  periodEnd: isoDateTimeSchema,
  metadata: metadataSchema,
  createdByUserId: z.string().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type CreatorGoal = z.infer<typeof CreatorGoalSchema>;

export const CreatorGoalProgressSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  creatorGoalId: z.string(),
  currentValue: z.string(),
  targetValue: z.string(),
  progressPercent: z.number().int().min(0).max(100),
  calculationSummary: metadataSchema,
  recalculatedAt: isoDateTimeSchema,
  metadata: metadataSchema,
  createdAt: isoDateTimeSchema,
});

export type CreatorGoalProgress = z.infer<typeof CreatorGoalProgressSchema>;

export const CreatorGoalListQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: CreatorGoalStatusSchema.optional(),
  goalType: CreatorGoalTypeSchema.optional(),
});

export type CreatorGoalListQuery = z.infer<typeof CreatorGoalListQuerySchema>;

export const ListCreatorGoalsResponseSchema = z.object({
  items: z.array(CreatorGoalSchema),
  nextCursor: z.string().nullable(),
});

export type ListCreatorGoalsResponse = z.infer<typeof ListCreatorGoalsResponseSchema>;

export const CreateCreatorGoalSchema = z
  .object({
    goalType: CreatorGoalTypeSchema,
    title: z.string().trim().min(1).max(255).nullable().optional(),
    targetValue: goalValueSchema,
    periodStart: isoDateTimeSchema,
    periodEnd: isoDateTimeSchema,
    metadata: metadataSchema.optional(),
  })
  .strict()
  .refine((data) => new Date(data.periodEnd).getTime() > new Date(data.periodStart).getTime(), {
    message: 'periodEnd must be after periodStart',
    path: ['periodEnd'],
  });

export type CreateCreatorGoalInput = z.infer<typeof CreateCreatorGoalSchema>;

export const UpdateCreatorGoalSchema = z
  .object({
    title: z.string().trim().min(1).max(255).nullable().optional(),
    targetValue: goalValueSchema.optional(),
    periodStart: isoDateTimeSchema.optional(),
    periodEnd: isoDateTimeSchema.optional(),
    metadata: metadataSchema.optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one goal field must be provided',
  });

export type UpdateCreatorGoalInput = z.infer<typeof UpdateCreatorGoalSchema>;

export const UpdateCreatorGoalStatusSchema = z
  .object({
    status: CreatorGoalStatusSchema,
    metadata: metadataSchema.optional(),
  })
  .strict();

export type UpdateCreatorGoalStatusInput = z.infer<typeof UpdateCreatorGoalStatusSchema>;

export const RecalculateCreatorGoalProgressResponseSchema = z.object({
  goal: CreatorGoalSchema,
  progress: CreatorGoalProgressSchema,
});

export type RecalculateCreatorGoalProgressResponse = z.infer<
  typeof RecalculateCreatorGoalProgressResponseSchema
>;
