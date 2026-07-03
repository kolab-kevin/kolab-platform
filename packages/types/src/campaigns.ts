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
