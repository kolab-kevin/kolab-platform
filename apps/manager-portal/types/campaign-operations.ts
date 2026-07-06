import { z } from 'zod';

export const CampaignOperationsDataSourceSchema = z.enum(['mock', 'live', 'partial', 'empty']);

export type CampaignOperationsDataSource = z.infer<typeof CampaignOperationsDataSourceSchema>;

export const CampaignBoardColumnSchema = z.enum([
  'draft',
  'recruiting',
  'active',
  'review',
  'completed',
]);

export type CampaignBoardColumn = z.infer<typeof CampaignBoardColumnSchema>;

export const ManagerCampaignListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  brandName: z.string().nullable(),
  status: z.string(),
  campaignType: z.string(),
  budgetLabel: z.string().nullable(),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  boardColumn: CampaignBoardColumnSchema,
  assignedCreators: z.number().int().nonnegative(),
  pendingApplications: z.number().int().nonnegative(),
  health: z.string(),
});

export type ManagerCampaignListItem = z.infer<typeof ManagerCampaignListItemSchema>;

export const ManagerCampaignOverviewSchema = z.object({
  activeCount: z.number().int().nonnegative(),
  upcomingCount: z.number().int().nonnegative(),
  completedCount: z.number().int().nonnegative(),
  healthLabel: z.string(),
  budgetSummary: z.string(),
  creatorParticipation: z.number().int().nonnegative(),
});

export type ManagerCampaignOverview = z.infer<typeof ManagerCampaignOverviewSchema>;

export const ManagerCampaignBoardItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  brandName: z.string().nullable(),
  status: z.string(),
  budgetLabel: z.string().nullable(),
});

export type ManagerCampaignBoardItem = z.infer<typeof ManagerCampaignBoardItemSchema>;

export const ManagerCampaignBoardSchema = z.object({
  draft: z.array(ManagerCampaignBoardItemSchema),
  recruiting: z.array(ManagerCampaignBoardItemSchema),
  active: z.array(ManagerCampaignBoardItemSchema),
  review: z.array(ManagerCampaignBoardItemSchema),
  completed: z.array(ManagerCampaignBoardItemSchema),
});

export type ManagerCampaignBoard = z.infer<typeof ManagerCampaignBoardSchema>;

export const ManagerCampaignStatusHistoryItemSchema = z.object({
  id: z.string(),
  status: z.string(),
  occurredAt: z.string(),
  note: z.string().nullable(),
});

export type ManagerCampaignStatusHistoryItem = z.infer<
  typeof ManagerCampaignStatusHistoryItemSchema
>;

export const ManagerCampaignDetailSchema = z.object({
  campaignId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  brandName: z.string().nullable(),
  budgetLabel: z.string().nullable(),
  timeline: z.array(z.object({ label: z.string(), value: z.string() })),
  deliverableTemplates: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      status: z.string(),
      dueAt: z.string().nullable(),
    }),
  ),
  assignedCreators: z.array(
    z.object({
      assignmentId: z.string(),
      creatorProfileId: z.string(),
      creatorDisplayName: z.string(),
      status: z.string(),
    }),
  ),
  statusHistory: z.array(ManagerCampaignStatusHistoryItemSchema),
});

export type ManagerCampaignDetail = z.infer<typeof ManagerCampaignDetailSchema>;

export const ManagerDeliverableItemSchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  campaignTitle: z.string(),
  title: z.string(),
  creatorDisplayName: z.string().nullable(),
  status: z.string(),
  dueAt: z.string().nullable(),
  bucket: z.enum(['pending', 'submitted', 'approved', 'rejected', 'overdue']),
});

export type ManagerDeliverableItem = z.infer<typeof ManagerDeliverableItemSchema>;

export const ManagerDeliverablesSummarySchema = z.object({
  pending: z.array(ManagerDeliverableItemSchema),
  submitted: z.array(ManagerDeliverableItemSchema),
  approved: z.array(ManagerDeliverableItemSchema),
  rejected: z.array(ManagerDeliverableItemSchema),
  overdue: z.array(ManagerDeliverableItemSchema),
});

export type ManagerDeliverablesSummary = z.infer<typeof ManagerDeliverablesSummarySchema>;

export const ManagerApplicationItemSchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  campaignTitle: z.string(),
  creatorProfileId: z.string(),
  creatorDisplayName: z.string(),
  status: z.string(),
  bucket: z.enum(['waiting', 'accepted', 'rejected']),
  appliedAt: z.string().nullable(),
});

export type ManagerApplicationItem = z.infer<typeof ManagerApplicationItemSchema>;

export const ManagerApplicationsSummarySchema = z.object({
  waiting: z.array(ManagerApplicationItemSchema),
  accepted: z.array(ManagerApplicationItemSchema),
  rejected: z.array(ManagerApplicationItemSchema),
});

export type ManagerApplicationsSummary = z.infer<typeof ManagerApplicationsSummarySchema>;

export const ManagerCampaignOperationsWorkspaceSchema = z.object({
  organizationId: z.string(),
  generatedAt: z.string(),
  overview: ManagerCampaignOverviewSchema,
  campaigns: z.array(ManagerCampaignListItemSchema),
  board: ManagerCampaignBoardSchema,
  detail: ManagerCampaignDetailSchema.nullable(),
  deliverables: ManagerDeliverablesSummarySchema,
  applications: ManagerApplicationsSummarySchema,
  selectedCampaignId: z.string().nullable(),
});

export type ManagerCampaignOperationsWorkspace = z.infer<
  typeof ManagerCampaignOperationsWorkspaceSchema
>;
