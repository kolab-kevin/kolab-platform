import { z } from 'zod';

export const OperationsCenterDataSourceSchema = z.enum(['mock', 'live', 'partial', 'empty']);

export type OperationsCenterDataSource = z.infer<typeof OperationsCenterDataSourceSchema>;

export const ManagerPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export type ManagerPriority = z.infer<typeof ManagerPrioritySchema>;

export const ManagerTaskBucketSchema = z.enum(['assigned', 'inProgress', 'waiting', 'completed']);

export type ManagerTaskBucket = z.infer<typeof ManagerTaskBucketSchema>;

export const ManagerTaskItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  priority: ManagerPrioritySchema,
  bucket: ManagerTaskBucketSchema,
  assigneeName: z.string().nullable(),
  dueAt: z.string().nullable(),
  sourceLabel: z.string(),
});

export type ManagerTaskItem = z.infer<typeof ManagerTaskItemSchema>;

export const ManagerTasksSummarySchema = z.object({
  assigned: z.array(ManagerTaskItemSchema),
  inProgress: z.array(ManagerTaskItemSchema),
  waiting: z.array(ManagerTaskItemSchema),
  completed: z.array(ManagerTaskItemSchema),
});

export type ManagerTasksSummary = z.infer<typeof ManagerTasksSummarySchema>;

export const ManagerAlertCategorySchema = z.enum([
  'live',
  'coach',
  'compliance',
  'campaign',
  'recruiting',
]);

export type ManagerAlertCategory = z.infer<typeof ManagerAlertCategorySchema>;

export const ManagerAlertItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: ManagerAlertCategorySchema,
  priority: ManagerPrioritySchema,
  occurredAt: z.string(),
  entityLabel: z.string().nullable(),
});

export type ManagerAlertItem = z.infer<typeof ManagerAlertItemSchema>;

export const ManagerAlertCenterSchema = z.object({
  live: z.array(ManagerAlertItemSchema),
  coach: z.array(ManagerAlertItemSchema),
  compliance: z.array(ManagerAlertItemSchema),
  campaign: z.array(ManagerAlertItemSchema),
  recruiting: z.array(ManagerAlertItemSchema),
});

export type ManagerAlertCenter = z.infer<typeof ManagerAlertCenterSchema>;

export const ManagerDeadlineCategorySchema = z.enum([
  'deliverables',
  'campaigns',
  'contracts',
  'compliance',
  'documents',
]);

export type ManagerDeadlineCategory = z.infer<typeof ManagerDeadlineCategorySchema>;

export const ManagerDeadlineItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: ManagerDeadlineCategorySchema,
  dueAt: z.string(),
  entityLabel: z.string().nullable(),
  priority: ManagerPrioritySchema,
});

export type ManagerDeadlineItem = z.infer<typeof ManagerDeadlineItemSchema>;

export const ManagerDeadlinesSummarySchema = z.object({
  deliverables: z.array(ManagerDeadlineItemSchema),
  campaigns: z.array(ManagerDeadlineItemSchema),
  contracts: z.array(ManagerDeadlineItemSchema),
  compliance: z.array(ManagerDeadlineItemSchema),
  documents: z.array(ManagerDeadlineItemSchema),
});

export type ManagerDeadlinesSummary = z.infer<typeof ManagerDeadlinesSummarySchema>;

export const ManagerActivityTypeSchema = z.enum([
  'creator_signed',
  'campaign_updated',
  'live_session_started',
  'goal_completed',
  'alert_created',
  'other',
]);

export type ManagerActivityType = z.infer<typeof ManagerActivityTypeSchema>;

export const ManagerActivityItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  activityType: ManagerActivityTypeSchema,
  occurredAt: z.string(),
  actorLabel: z.string().nullable(),
  description: z.string().nullable(),
});

export type ManagerActivityItem = z.infer<typeof ManagerActivityItemSchema>;

export const ManagerAiRecommendationItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  priority: ManagerPrioritySchema,
  summary: z.string(),
  sourceLabel: z.string(),
});

export type ManagerAiRecommendationItem = z.infer<typeof ManagerAiRecommendationItemSchema>;

export const ManagerAiRecommendationsSchema = z.object({
  high: z.array(ManagerAiRecommendationItemSchema),
  medium: z.array(ManagerAiRecommendationItemSchema),
  low: z.array(ManagerAiRecommendationItemSchema),
});

export type ManagerAiRecommendations = z.infer<typeof ManagerAiRecommendationsSchema>;

export const ManagerOperationsOverviewSchema = z.object({
  openTasks: z.number().int().nonnegative(),
  criticalAlerts: z.number().int().nonnegative(),
  overdueFollowUps: z.number().int().nonnegative(),
  campaignDeadlines: z.number().int().nonnegative(),
  liveIssues: z.number().int().nonnegative(),
  complianceIssues: z.number().int().nonnegative(),
});

export type ManagerOperationsOverview = z.infer<typeof ManagerOperationsOverviewSchema>;

export const ManagerOperationsCenterWorkspaceSchema = z.object({
  organizationId: z.string(),
  generatedAt: z.string(),
  overview: ManagerOperationsOverviewSchema,
  tasks: ManagerTasksSummarySchema,
  alerts: ManagerAlertCenterSchema,
  deadlines: ManagerDeadlinesSummarySchema,
  activityFeed: z.array(ManagerActivityItemSchema),
  aiRecommendations: ManagerAiRecommendationsSchema,
});

export type ManagerOperationsCenterWorkspace = z.infer<
  typeof ManagerOperationsCenterWorkspaceSchema
>;
