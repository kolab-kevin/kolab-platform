import { z } from 'zod';

export const ManagerDashboardAgencyOverviewSchema = z.object({
  activeCreators: z.number().int().nonnegative(),
  totalCreators: z.number().int().nonnegative(),
  liveSessionsToday: z.number().int().nonnegative(),
  openCampaigns: z.number().int().nonnegative(),
});

export const ManagerDashboardCreatorHealthSchema = z.object({
  atRiskCount: z.number().int().nonnegative(),
  improvingCount: z.number().int().nonnegative(),
  averagePerformanceScore: z.number().min(0).max(100),
  highlights: z.array(z.string()),
});

export const ManagerDashboardLiveOperationsSchema = z.object({
  liveNow: z.number().int().nonnegative(),
  scheduledToday: z.number().int().nonnegative(),
  alertsOpen: z.number().int().nonnegative(),
  recentSessions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      status: z.string(),
    }),
  ),
});

export const ManagerDashboardCampaignHealthSchema = z.object({
  activeCampaigns: z.number().int().nonnegative(),
  overdueDeliverables: z.number().int().nonnegative(),
  pendingApplications: z.number().int().nonnegative(),
  atRiskAssignments: z.number().int().nonnegative(),
});

export const ManagerDashboardRecruitingPipelineSchema = z.object({
  newLeads: z.number().int().nonnegative(),
  inReview: z.number().int().nonnegative(),
  convertedThisMonth: z.number().int().nonnegative(),
  stages: z.array(
    z.object({
      label: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
});

export const ManagerDashboardTasksAndAlertsSchema = z.object({
  openTasks: z.number().int().nonnegative(),
  urgentAlerts: z.number().int().nonnegative(),
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    }),
  ),
});

export const ManagerDashboardRevenueSchema = z.object({
  placeholder: z.literal(true),
  mtdRevenue: z.string(),
  note: z.string(),
});

export const ManagerDashboardComplianceBlockersSchema = z.object({
  blockedCreators: z.number().int().nonnegative(),
  expiringDocuments: z.number().int().nonnegative(),
  items: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      severity: z.enum(['warning', 'critical']),
    }),
  ),
});

export const ManagerDashboardResponseSchema = z.object({
  organizationId: z.string(),
  generatedAt: z.string(),
  agencyOverview: ManagerDashboardAgencyOverviewSchema,
  creatorHealth: ManagerDashboardCreatorHealthSchema,
  liveOperations: ManagerDashboardLiveOperationsSchema,
  campaignHealth: ManagerDashboardCampaignHealthSchema,
  recruitingPipeline: ManagerDashboardRecruitingPipelineSchema,
  tasksAndAlerts: ManagerDashboardTasksAndAlertsSchema,
  revenue: ManagerDashboardRevenueSchema,
  complianceBlockers: ManagerDashboardComplianceBlockersSchema,
});

export type ManagerDashboardResponse = z.infer<typeof ManagerDashboardResponseSchema>;

export type ManagerDashboardFetchResult = {
  data: ManagerDashboardResponse;
  source: 'mock';
};
