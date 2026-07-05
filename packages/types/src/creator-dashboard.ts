import { z } from 'zod';

import { CreatorComplianceOverallStatusSchema } from './creator-compliance';
import { CreatorGoalTypeSchema } from './creator-goals';
import { CreatorOnboardingOverallStatusSchema } from './creator-onboarding';
import { LiveTrendOverallDirectionSchema } from './live-intelligence';

const isoDateTimeSchema = z.string().datetime();

export const CreatorDashboardQuickActionSchema = z.enum([
  'GO_LIVE',
  'COMPLETE_DELIVERABLE',
  'REVIEW_CAMPAIGN',
  'VIEW_RECOMMENDATIONS',
  'UPDATE_PROFILE',
  'FINISH_ONBOARDING',
]);

export type CreatorDashboardQuickAction = z.infer<typeof CreatorDashboardQuickActionSchema>;

export const CreatorDashboardQuickActionPrioritySchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);

export type CreatorDashboardQuickActionPriority = z.infer<
  typeof CreatorDashboardQuickActionPrioritySchema
>;

export const CreatorDashboardOverviewSchema = z.object({
  creatorProfileId: z.string(),
  displayName: z.string().nullable(),
  profileStatus: z.string(),
  performanceScore: z.number().int().min(0).max(100).nullable(),
  overallIntelligenceScore: z.number().int().min(0).max(100).nullable(),
  liveTrendDirection: LiveTrendOverallDirectionSchema.nullable(),
});

export const CreatorDashboardGoalItemSchema = z.object({
  id: z.string(),
  goalType: CreatorGoalTypeSchema,
  title: z.string().nullable(),
  targetValue: z.string(),
  currentValue: z.string(),
  progressPercent: z.number().int().min(0).max(100),
  periodEnd: isoDateTimeSchema,
});

export const CreatorDashboardTodaysGoalsSchema = z.object({
  activeGoals: z.array(CreatorDashboardGoalItemSchema),
  completedToday: z.number().int().nonnegative(),
  progressPercentages: z.array(z.number().int().min(0).max(100)),
});

export const CreatorDashboardAssignedCampaignSchema = z.object({
  assignmentId: z.string(),
  campaignId: z.string(),
  campaignTitle: z.string(),
  status: z.string(),
  dueAt: isoDateTimeSchema.nullable(),
});

export const CreatorDashboardPendingApplicationSchema = z.object({
  applicationId: z.string(),
  campaignId: z.string(),
  campaignTitle: z.string(),
  status: z.string(),
  dueAt: isoDateTimeSchema.nullable(),
});

export const CreatorDashboardCampaignDueDateSchema = z.object({
  campaignId: z.string(),
  label: z.string(),
  dueAt: isoDateTimeSchema,
});

export const CreatorDashboardUpcomingCampaignsSchema = z.object({
  assignedCampaigns: z.array(CreatorDashboardAssignedCampaignSchema),
  pendingApplications: z.array(CreatorDashboardPendingApplicationSchema),
  dueDates: z.array(CreatorDashboardCampaignDueDateSchema),
});

export const CreatorDashboardDeliverableItemSchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  campaignTitle: z.string(),
  dueAt: isoDateTimeSchema.nullable(),
  status: z.string(),
});

export const CreatorDashboardDeliverablesSchema = z.object({
  upcoming: z.array(CreatorDashboardDeliverableItemSchema),
  overdue: z.array(CreatorDashboardDeliverableItemSchema),
  completedToday: z.number().int().nonnegative(),
});

export const CreatorDashboardLatestLiveSessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  startedAt: isoDateTimeSchema.nullable(),
  endedAt: isoDateTimeSchema.nullable(),
  durationSeconds: z.number().int().nonnegative().nullable(),
  totalGiftValue: z.string().nullable(),
});

export const CreatorDashboardNextScheduledLiveSchema = z.object({
  id: z.string(),
  title: z.string(),
  scheduledStart: isoDateTimeSchema.nullable(),
  scheduledEnd: isoDateTimeSchema.nullable(),
  status: z.string(),
});

export const CreatorDashboardLiveActivitySchema = z.object({
  latestLiveSession: CreatorDashboardLatestLiveSessionSchema.nullable(),
  nextScheduledLive: CreatorDashboardNextScheduledLiveSchema.nullable(),
  lastPerformanceScore: z.number().int().min(0).max(100).nullable(),
  sessionDuration: z.number().int().nonnegative().nullable(),
  latestRevenue: z.string().nullable(),
});

export const CreatorDashboardRecommendationSchema = z.object({
  id: z.string(),
  recommendationType: z.string(),
  priority: CreatorDashboardQuickActionPrioritySchema,
  title: z.string(),
  description: z.string(),
});

export const CreatorDashboardAlertSchema = z.object({
  id: z.string(),
  alertType: z.string(),
  priority: CreatorDashboardQuickActionPrioritySchema,
  title: z.string(),
  message: z.string(),
  recommendedAction: z.string(),
});

export const CreatorDashboardCoachSchema = z.object({
  activeRecommendations: z.array(CreatorDashboardRecommendationSchema),
  activeAlerts: z.array(CreatorDashboardAlertSchema),
  topCoachingPriorities: z.array(z.string()),
});

export const CreatorDashboardPerformanceSchema = z.object({
  trendSummary: z.string().nullable(),
  strongestAreas: z.array(z.string()),
  weakestAreas: z.array(z.string()),
});

export const CreatorDashboardCompletedGoalSchema = z.object({
  id: z.string(),
  goalType: CreatorGoalTypeSchema,
  title: z.string().nullable(),
  completedAt: isoDateTimeSchema.nullable(),
});

export const CreatorDashboardAchievementsSchema = z.object({
  recentCompletedGoals: z.array(CreatorDashboardCompletedGoalSchema),
  newPerformanceMilestones: z.array(z.string()),
});

export const CreatorDashboardComplianceSchema = z.object({
  onboardingCompletionPercent: z.number().int().min(0).max(100),
  onboardingStatus: CreatorOnboardingOverallStatusSchema,
  complianceStatus: CreatorComplianceOverallStatusSchema,
  missingRequirements: z.array(z.string()),
});

export const CreatorDashboardQuickActionItemSchema = z.object({
  action: CreatorDashboardQuickActionSchema,
  priority: CreatorDashboardQuickActionPrioritySchema,
  reason: z.string(),
});

export const CreatorDashboardResponseSchema = z.object({
  creatorProfileId: z.string(),
  organizationId: z.string(),
  generatedAt: isoDateTimeSchema,
  overview: CreatorDashboardOverviewSchema,
  todaysGoals: CreatorDashboardTodaysGoalsSchema,
  upcomingCampaigns: CreatorDashboardUpcomingCampaignsSchema,
  deliverables: CreatorDashboardDeliverablesSchema,
  liveActivity: CreatorDashboardLiveActivitySchema,
  coach: CreatorDashboardCoachSchema,
  performance: CreatorDashboardPerformanceSchema,
  achievements: CreatorDashboardAchievementsSchema,
  compliance: CreatorDashboardComplianceSchema,
  quickActions: z.array(CreatorDashboardQuickActionItemSchema),
});

export type CreatorDashboardResponse = z.infer<typeof CreatorDashboardResponseSchema>;
