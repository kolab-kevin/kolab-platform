import { z } from 'zod';

export const ReportingDataSourceSchema = z.enum(['mock', 'live', 'partial', 'empty']);

export type ReportingDataSource = z.infer<typeof ReportingDataSourceSchema>;

export const ManagerMetricItemSchema = z.object({
  label: z.string(),
  value: z.string(),
  trend: z.enum(['up', 'down', 'flat']).nullable(),
  trendLabel: z.string().nullable(),
});

export type ManagerMetricItem = z.infer<typeof ManagerMetricItemSchema>;

export const ManagerExecutiveOverviewSchema = z.object({
  totalCreators: z.number().int().nonnegative(),
  activeCreators: z.number().int().nonnegative(),
  revenueLabel: z.string(),
  liveHoursLabel: z.string(),
  activeCampaigns: z.number().int().nonnegative(),
  recruitingFunnelLabel: z.string(),
  organizationHealthScore: z.number().int().min(0).max(100),
  healthLabel: z.string(),
});

export type ManagerExecutiveOverview = z.infer<typeof ManagerExecutiveOverviewSchema>;

export const ManagerDistributionItemSchema = z.object({
  label: z.string(),
  count: z.number().int().nonnegative(),
});

export type ManagerDistributionItem = z.infer<typeof ManagerDistributionItemSchema>;

export const ManagerNamedMetricSchema = z.object({
  name: z.string(),
  value: z.string(),
  detail: z.string().nullable(),
});

export type ManagerNamedMetric = z.infer<typeof ManagerNamedMetricSchema>;

export const ManagerCreatorAnalyticsSchema = z.object({
  growthLabel: z.string(),
  performanceDistribution: z.array(ManagerDistributionItemSchema),
  retentionLabel: z.string(),
  topPerformers: z.array(ManagerNamedMetricSchema),
  atRiskCreators: z.array(ManagerNamedMetricSchema),
});

export type ManagerCreatorAnalytics = z.infer<typeof ManagerCreatorAnalyticsSchema>;

export const ManagerCampaignAnalyticsSchema = z.object({
  activeCampaigns: z.number().int().nonnegative(),
  completionRateLabel: z.string(),
  deliverablesSummary: z.string(),
  revenueLabel: z.string(),
  roiLabel: z.string(),
});

export type ManagerCampaignAnalytics = z.infer<typeof ManagerCampaignAnalyticsSchema>;

export const ManagerRecruitingAnalyticsSchema = z.object({
  leadSources: z.array(ManagerDistributionItemSchema),
  conversionFunnelLabel: z.string(),
  recruiterPerformance: z.array(ManagerNamedMetricSchema),
  timeToConversionLabel: z.string(),
});

export type ManagerRecruitingAnalytics = z.infer<typeof ManagerRecruitingAnalyticsSchema>;

export const ManagerLiveAnalyticsSchema = z.object({
  sessionCount: z.number().int().nonnegative(),
  liveHoursLabel: z.string(),
  viewerTrendLabel: z.string(),
  giftTrendLabel: z.string(),
  engagementLabel: z.string(),
});

export type ManagerLiveAnalytics = z.infer<typeof ManagerLiveAnalyticsSchema>;

export const ManagerIntelligenceItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});

export type ManagerIntelligenceItem = z.infer<typeof ManagerIntelligenceItemSchema>;

export const ManagerIntelligenceDashboardSchema = z.object({
  recommendations: z.array(ManagerIntelligenceItemSchema),
  emergingTrends: z.array(ManagerIntelligenceItemSchema),
  organizationRisks: z.array(ManagerIntelligenceItemSchema),
  coachingOpportunities: z.array(ManagerIntelligenceItemSchema),
});

export type ManagerIntelligenceDashboard = z.infer<typeof ManagerIntelligenceDashboardSchema>;

export const ManagerExportOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
});

export type ManagerExportOption = z.infer<typeof ManagerExportOptionSchema>;

export const ManagerExportCenterSchema = z.object({
  options: z.array(ManagerExportOptionSchema),
});

export type ManagerExportCenter = z.infer<typeof ManagerExportCenterSchema>;

export const ManagerReportingWorkspaceSchema = z.object({
  organizationId: z.string(),
  generatedAt: z.string(),
  executiveOverview: ManagerExecutiveOverviewSchema,
  creatorAnalytics: ManagerCreatorAnalyticsSchema,
  campaignAnalytics: ManagerCampaignAnalyticsSchema,
  recruitingAnalytics: ManagerRecruitingAnalyticsSchema,
  liveAnalytics: ManagerLiveAnalyticsSchema,
  intelligence: ManagerIntelligenceDashboardSchema,
  exportCenter: ManagerExportCenterSchema,
});

export type ManagerReportingWorkspace = z.infer<typeof ManagerReportingWorkspaceSchema>;
