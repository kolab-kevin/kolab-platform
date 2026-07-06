import { z } from 'zod';

export const RecruitingDataSourceSchema = z.enum(['mock', 'live', 'partial', 'empty']);

export type RecruitingDataSource = z.infer<typeof RecruitingDataSourceSchema>;

export const ProspectPipelineColumnSchema = z.enum([
  'new',
  'contacted',
  'interested',
  'interview',
  'pending',
  'signed',
  'declined',
]);

export type ProspectPipelineColumn = z.infer<typeof ProspectPipelineColumnSchema>;

export const ManagerProspectListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  nickname: z.string().nullable(),
  status: z.string(),
  source: z.string(),
  score: z.number().int(),
  pipelineColumn: ProspectPipelineColumnSchema,
  assignedRecruiterId: z.string().nullable(),
  assignedRecruiterName: z.string().nullable(),
  nextFollowUpAt: z.string().nullable(),
  platformLabel: z.string().nullable(),
});

export type ManagerProspectListItem = z.infer<typeof ManagerProspectListItemSchema>;

export const ManagerRecruitingOverviewSchema = z.object({
  totalProspects: z.number().int().nonnegative(),
  newLeads: z.number().int().nonnegative(),
  activeConversations: z.number().int().nonnegative(),
  pendingFollowUps: z.number().int().nonnegative(),
  signedCreators: z.number().int().nonnegative(),
  conversionFunnel: z.string(),
});

export type ManagerRecruitingOverview = z.infer<typeof ManagerRecruitingOverviewSchema>;

export const ManagerProspectBoardItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  score: z.number().int(),
  assignedRecruiterName: z.string().nullable(),
  nextFollowUpAt: z.string().nullable(),
});

export type ManagerProspectBoardItem = z.infer<typeof ManagerProspectBoardItemSchema>;

export const ManagerProspectPipelineSchema = z.object({
  new: z.array(ManagerProspectBoardItemSchema),
  contacted: z.array(ManagerProspectBoardItemSchema),
  interested: z.array(ManagerProspectBoardItemSchema),
  interview: z.array(ManagerProspectBoardItemSchema),
  pending: z.array(ManagerProspectBoardItemSchema),
  signed: z.array(ManagerProspectBoardItemSchema),
  declined: z.array(ManagerProspectBoardItemSchema),
});

export type ManagerProspectPipeline = z.infer<typeof ManagerProspectPipelineSchema>;

export const ManagerFollowUpHistoryItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  occurredAt: z.string(),
  note: z.string().nullable(),
});

export type ManagerFollowUpHistoryItem = z.infer<typeof ManagerFollowUpHistoryItemSchema>;

export const ManagerProspectDetailSchema = z.object({
  prospectId: z.string(),
  name: z.string(),
  contactInfo: z.array(z.object({ label: z.string(), value: z.string().nullable() })),
  platforms: z.array(
    z.object({
      platform: z.string(),
      username: z.string(),
      followers: z.number().int().nullable(),
    }),
  ),
  audienceLabel: z.string(),
  languages: z.array(z.string()),
  notes: z.array(z.object({ id: z.string(), content: z.string(), createdAt: z.string() })),
  assignedRecruiterName: z.string().nullable(),
  status: z.string(),
  followUpHistory: z.array(ManagerFollowUpHistoryItemSchema),
  tags: z.array(z.string()),
  source: z.string(),
});

export type ManagerProspectDetail = z.infer<typeof ManagerProspectDetailSchema>;

export const ManagerFollowUpQueueItemSchema = z.object({
  id: z.string(),
  prospectName: z.string(),
  assignedRecruiterName: z.string().nullable(),
  status: z.string(),
  nextFollowUpAt: z.string(),
  bucket: z.enum(['overdue', 'today', 'upcoming']),
});

export type ManagerFollowUpQueueItem = z.infer<typeof ManagerFollowUpQueueItemSchema>;

export const ManagerFollowUpQueueSchema = z.object({
  overdue: z.array(ManagerFollowUpQueueItemSchema),
  today: z.array(ManagerFollowUpQueueItemSchema),
  upcoming: z.array(ManagerFollowUpQueueItemSchema),
});

export type ManagerFollowUpQueue = z.infer<typeof ManagerFollowUpQueueSchema>;

export const ManagerRecruiterPerformanceItemSchema = z.object({
  recruiterId: z.string(),
  recruiterName: z.string(),
  leadsContacted: z.number().int().nonnegative(),
  responseRateLabel: z.string(),
  conversionRateLabel: z.string(),
  signedCreators: z.number().int().nonnegative(),
  activeWorkload: z.number().int().nonnegative(),
});

export type ManagerRecruiterPerformanceItem = z.infer<typeof ManagerRecruiterPerformanceItemSchema>;

export const ManagerRecruiterPerformanceSchema = z.object({
  items: z.array(ManagerRecruiterPerformanceItemSchema),
});

export type ManagerRecruiterPerformance = z.infer<typeof ManagerRecruiterPerformanceSchema>;

export const ManagerRecruitingWorkspaceSchema = z.object({
  organizationId: z.string(),
  generatedAt: z.string(),
  overview: ManagerRecruitingOverviewSchema,
  prospects: z.array(ManagerProspectListItemSchema),
  pipeline: ManagerProspectPipelineSchema,
  detail: ManagerProspectDetailSchema.nullable(),
  followUpQueue: ManagerFollowUpQueueSchema,
  recruiterPerformance: ManagerRecruiterPerformanceSchema,
  selectedProspectId: z.string().nullable(),
});

export type ManagerRecruitingWorkspace = z.infer<typeof ManagerRecruitingWorkspaceSchema>;
