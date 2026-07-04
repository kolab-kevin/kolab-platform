import { z } from 'zod';

export const CampaignStatusSchema = z.enum([
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
  'ARCHIVED',
]);

export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;

export const CampaignTypeSchema = z.enum([
  'BRAND_DEAL',
  'LIVE_STREAM',
  'TIKTOK_SHOP',
  'UGC',
  'AFFILIATE',
  'OTHER',
]);

export type CampaignType = z.infer<typeof CampaignTypeSchema>;

export const CampaignDeliverableStatusSchema = z.enum([
  'DRAFT',
  'OPEN',
  'IN_PROGRESS',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
]);

export type CampaignDeliverableStatus = z.infer<typeof CampaignDeliverableStatusSchema>;

const metadataSchema = z.record(z.unknown());

const isoDateTimeSchema = z.string().datetime();

const optionalNullableIsoDateTimeSchema = z.string().datetime().nullable().optional();

const budgetAmountSchema = z.number().nonnegative().max(9999999999.99);

const budgetCurrencySchema = z.string().trim().min(3).max(3);

export const CampaignSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  brandName: z.string().nullable(),
  campaignType: CampaignTypeSchema,
  status: CampaignStatusSchema,
  budgetAmount: z.string().nullable(),
  budgetCurrency: z.string().nullable(),
  startsAt: isoDateTimeSchema.nullable(),
  endsAt: isoDateTimeSchema.nullable(),
  applicationDeadline: isoDateTimeSchema.nullable(),
  brief: metadataSchema,
  requirements: metadataSchema,
  metadata: metadataSchema,
  createdByUserId: z.string(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type Campaign = z.infer<typeof CampaignSchema>;

export const CampaignDeliverableSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  campaignId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: CampaignDeliverableStatusSchema,
  dueAt: isoDateTimeSchema.nullable(),
  requirements: metadataSchema,
  metadata: metadataSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type CampaignDeliverable = z.infer<typeof CampaignDeliverableSchema>;

export const CampaignListQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: CampaignStatusSchema.optional(),
  campaignType: CampaignTypeSchema.optional(),
  search: z.string().trim().min(1).max(255).optional(),
});

export type CampaignListQuery = z.infer<typeof CampaignListQuerySchema>;

export const ListCampaignsResponseSchema = z.object({
  items: z.array(CampaignSchema),
  nextCursor: z.string().nullable(),
});

export type ListCampaignsResponse = z.infer<typeof ListCampaignsResponseSchema>;

export const CreateCampaignSchema = z
  .object({
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().min(1).max(5000).nullable().optional(),
    brandName: z.string().trim().min(1).max(255).nullable().optional(),
    campaignType: CampaignTypeSchema,
    budgetAmount: budgetAmountSchema.nullable().optional(),
    budgetCurrency: budgetCurrencySchema.nullable().optional(),
    startsAt: isoDateTimeSchema.nullable().optional(),
    endsAt: isoDateTimeSchema.nullable().optional(),
    applicationDeadline: isoDateTimeSchema.nullable().optional(),
    brief: metadataSchema.optional(),
    requirements: metadataSchema.optional(),
    metadata: metadataSchema.optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.budgetAmount === undefined ||
      data.budgetAmount === null ||
      typeof data.budgetCurrency === 'string',
    {
      message: 'budgetCurrency is required when budgetAmount is provided',
      path: ['budgetCurrency'],
    },
  );

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;

export const UpdateCampaignSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().min(1).max(5000).nullable().optional(),
    brandName: z.string().trim().min(1).max(255).nullable().optional(),
    campaignType: CampaignTypeSchema.optional(),
    budgetAmount: budgetAmountSchema.nullable().optional(),
    budgetCurrency: budgetCurrencySchema.nullable().optional(),
    startsAt: optionalNullableIsoDateTimeSchema,
    endsAt: optionalNullableIsoDateTimeSchema,
    applicationDeadline: optionalNullableIsoDateTimeSchema,
    brief: metadataSchema.optional(),
    requirements: metadataSchema.optional(),
    metadata: metadataSchema.optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one campaign field must be provided',
  });

export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>;

export const UpdateCampaignStatusSchema = z
  .object({
    status: CampaignStatusSchema,
    metadata: metadataSchema.optional(),
  })
  .strict();

export type UpdateCampaignStatusInput = z.infer<typeof UpdateCampaignStatusSchema>;

export const ListCampaignDeliverablesResponseSchema = z.object({
  items: z.array(CampaignDeliverableSchema),
});

export type ListCampaignDeliverablesResponse = z.infer<
  typeof ListCampaignDeliverablesResponseSchema
>;

export const CreateCampaignDeliverableSchema = z
  .object({
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().min(1).max(5000).nullable().optional(),
    dueAt: isoDateTimeSchema.nullable().optional(),
    requirements: metadataSchema.optional(),
    metadata: metadataSchema.optional(),
  })
  .strict();

export type CreateCampaignDeliverableInput = z.infer<typeof CreateCampaignDeliverableSchema>;

export const UpdateCampaignDeliverableSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().min(1).max(5000).nullable().optional(),
    dueAt: optionalNullableIsoDateTimeSchema,
    requirements: metadataSchema.optional(),
    metadata: metadataSchema.optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one deliverable field must be provided',
  });

export type UpdateCampaignDeliverableInput = z.infer<typeof UpdateCampaignDeliverableSchema>;

export const UpdateCampaignDeliverableStatusSchema = z
  .object({
    status: CampaignDeliverableStatusSchema,
    metadata: metadataSchema.optional(),
  })
  .strict();

export type UpdateCampaignDeliverableStatusInput = z.infer<
  typeof UpdateCampaignDeliverableStatusSchema
>;

export const CampaignApplicationStatusSchema = z.enum([
  'INVITED',
  'APPLIED',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
  'CANCELLED',
]);

export type CampaignApplicationStatus = z.infer<typeof CampaignApplicationStatusSchema>;

export const CampaignApplicationSourceSchema = z.enum(['INVITE', 'CREATOR_APPLIED', 'MANUAL']);

export type CampaignApplicationSource = z.infer<typeof CampaignApplicationSourceSchema>;

export const CampaignApplicationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  campaignId: z.string(),
  creatorProfileId: z.string(),
  status: CampaignApplicationStatusSchema,
  source: CampaignApplicationSourceSchema,
  message: z.string().nullable(),
  invitedByUserId: z.string().nullable(),
  appliedAt: isoDateTimeSchema.nullable(),
  reviewedByUserId: z.string().nullable(),
  reviewedAt: isoDateTimeSchema.nullable(),
  decisionReason: z.string().nullable(),
  metadata: metadataSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type CampaignApplication = z.infer<typeof CampaignApplicationSchema>;

export const CampaignApplicationListQuerySchema = z.object({
  status: CampaignApplicationStatusSchema.optional(),
  creatorProfileId: z.string().min(1).optional(),
});

export type CampaignApplicationListQuery = z.infer<typeof CampaignApplicationListQuerySchema>;

export const ListCampaignApplicationsResponseSchema = z.object({
  items: z.array(CampaignApplicationSchema),
});

export type ListCampaignApplicationsResponse = z.infer<
  typeof ListCampaignApplicationsResponseSchema
>;

export const InviteCampaignApplicationSchema = z
  .object({
    creatorProfileId: z.string().min(1),
    message: z.string().trim().min(1).max(5000).nullable().optional(),
    metadata: metadataSchema.optional(),
  })
  .strict();

export type InviteCampaignApplicationInput = z.infer<typeof InviteCampaignApplicationSchema>;

export const ApplyCampaignApplicationSchema = z
  .object({
    creatorProfileId: z.string().min(1),
    message: z.string().trim().min(1).max(5000).nullable().optional(),
    metadata: metadataSchema.optional(),
  })
  .strict();

export type ApplyCampaignApplicationInput = z.infer<typeof ApplyCampaignApplicationSchema>;

export const RejectCampaignApplicationSchema = z
  .object({
    decisionReason: z.string().trim().min(1).max(5000).nullable().optional(),
    metadata: metadataSchema.optional(),
  })
  .strict();

export type RejectCampaignApplicationInput = z.infer<typeof RejectCampaignApplicationSchema>;

export const AcceptCampaignApplicationSchema = z
  .object({
    metadata: metadataSchema.optional(),
  })
  .strict();

export type AcceptCampaignApplicationInput = z.infer<typeof AcceptCampaignApplicationSchema>;

export const WithdrawCampaignApplicationSchema = z
  .object({
    metadata: metadataSchema.optional(),
  })
  .strict();

export type WithdrawCampaignApplicationInput = z.infer<typeof WithdrawCampaignApplicationSchema>;

export const CampaignAssignmentStatusSchema = z.enum([
  'ASSIGNED',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

export type CampaignAssignmentStatus = z.infer<typeof CampaignAssignmentStatusSchema>;

export const CampaignCreatorDeliverableStatusSchema = z.enum([
  'ASSIGNED',
  'IN_PROGRESS',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
]);

export type CampaignCreatorDeliverableStatus = z.infer<
  typeof CampaignCreatorDeliverableStatusSchema
>;

export const CampaignCreatorAssignmentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  campaignId: z.string(),
  creatorProfileId: z.string(),
  applicationId: z.string().nullable(),
  status: CampaignAssignmentStatusSchema,
  assignedByUserId: z.string(),
  assignedAt: isoDateTimeSchema,
  acceptedAt: isoDateTimeSchema.nullable(),
  completedAt: isoDateTimeSchema.nullable(),
  cancelledAt: isoDateTimeSchema.nullable(),
  metadata: metadataSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type CampaignCreatorAssignment = z.infer<typeof CampaignCreatorAssignmentSchema>;

export const CampaignCreatorDeliverableSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  assignmentId: z.string(),
  campaignDeliverableId: z.string(),
  status: CampaignCreatorDeliverableStatusSchema,
  dueAt: isoDateTimeSchema.nullable(),
  submittedAt: isoDateTimeSchema.nullable(),
  approvedAt: isoDateTimeSchema.nullable(),
  rejectedAt: isoDateTimeSchema.nullable(),
  rejectionReason: z.string().nullable(),
  submissionUrl: z.string().nullable(),
  notes: z.string().nullable(),
  metadata: metadataSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type CampaignCreatorDeliverable = z.infer<typeof CampaignCreatorDeliverableSchema>;

export const CampaignAssignmentListQuerySchema = z.object({
  status: CampaignAssignmentStatusSchema.optional(),
  creatorProfileId: z.string().min(1).optional(),
});

export type CampaignAssignmentListQuery = z.infer<typeof CampaignAssignmentListQuerySchema>;

export const ListCampaignCreatorAssignmentsResponseSchema = z.object({
  items: z.array(CampaignCreatorAssignmentSchema),
});

export type ListCampaignCreatorAssignmentsResponse = z.infer<
  typeof ListCampaignCreatorAssignmentsResponseSchema
>;

export const CreateCampaignCreatorAssignmentSchema = z
  .object({
    creatorProfileId: z.string().min(1),
    applicationId: z.string().min(1).nullable().optional(),
    metadata: metadataSchema.optional(),
  })
  .strict();

export type CreateCampaignCreatorAssignmentInput = z.infer<
  typeof CreateCampaignCreatorAssignmentSchema
>;

export const UpdateCampaignCreatorAssignmentStatusSchema = z
  .object({
    status: CampaignAssignmentStatusSchema,
    metadata: metadataSchema.optional(),
  })
  .strict();

export type UpdateCampaignCreatorAssignmentStatusInput = z.infer<
  typeof UpdateCampaignCreatorAssignmentStatusSchema
>;

export const ListCampaignCreatorDeliverablesResponseSchema = z.object({
  items: z.array(CampaignCreatorDeliverableSchema),
});

export type ListCampaignCreatorDeliverablesResponse = z.infer<
  typeof ListCampaignCreatorDeliverablesResponseSchema
>;

export const CreateCampaignCreatorDeliverableSchema = z
  .object({
    campaignDeliverableId: z.string().min(1),
    dueAt: isoDateTimeSchema.nullable().optional(),
    notes: z.string().trim().min(1).max(5000).nullable().optional(),
    metadata: metadataSchema.optional(),
  })
  .strict();

export type CreateCampaignCreatorDeliverableInput = z.infer<
  typeof CreateCampaignCreatorDeliverableSchema
>;

export const UpdateCampaignCreatorDeliverableSchema = z
  .object({
    dueAt: optionalNullableIsoDateTimeSchema,
    submissionUrl: z.string().trim().min(1).max(2048).nullable().optional(),
    notes: z.string().trim().min(1).max(5000).nullable().optional(),
    metadata: metadataSchema.optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one creator deliverable field must be provided',
  });

export type UpdateCampaignCreatorDeliverableInput = z.infer<
  typeof UpdateCampaignCreatorDeliverableSchema
>;

export const UpdateCampaignCreatorDeliverableStatusSchema = z
  .object({
    status: CampaignCreatorDeliverableStatusSchema,
    rejectionReason: z.string().trim().min(1).max(5000).nullable().optional(),
    metadata: metadataSchema.optional(),
  })
  .strict();

export type UpdateCampaignCreatorDeliverableStatusInput = z.infer<
  typeof UpdateCampaignCreatorDeliverableStatusSchema
>;

export const CampaignCreatorMatchBandSchema = z.enum([
  'STRONG_MATCH',
  'GOOD_MATCH',
  'POSSIBLE_MATCH',
  'WEAK_MATCH',
  'NOT_RECOMMENDED',
]);

export type CampaignCreatorMatchBand = z.infer<typeof CampaignCreatorMatchBandSchema>;

export const CampaignCreatorMatchPerformanceSummarySchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  scoreBand: z.string(),
});

export type CampaignCreatorMatchPerformanceSummary = z.infer<
  typeof CampaignCreatorMatchPerformanceSummarySchema
>;

export const CampaignCreatorMatchSchema = z.object({
  creatorProfileId: z.string(),
  displayName: z.string().nullable(),
  score: z.number().int().min(0).max(100),
  recommendationBand: CampaignCreatorMatchBandSchema,
  reasons: z.array(z.string()),
  risks: z.array(z.string()),
  missingData: z.array(z.string()),
  relevantPlatforms: z.array(z.string()),
  relevantSkills: z.array(z.string()),
  performanceScoreSummary: CampaignCreatorMatchPerformanceSummarySchema.nullable(),
});

export type CampaignCreatorMatch = z.infer<typeof CampaignCreatorMatchSchema>;

export const CampaignCreatorMatchesSnapshotSchema = z.object({
  campaignId: z.string(),
  generatedAt: isoDateTimeSchema,
  totalCandidates: z.number().int().nonnegative(),
  matches: z.array(CampaignCreatorMatchSchema),
});

export type CampaignCreatorMatchesSnapshot = z.infer<typeof CampaignCreatorMatchesSnapshotSchema>;
