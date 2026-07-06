import { z } from 'zod';

export const ManagerCreatorListItemSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  email: z.string().nullable(),
  country: z.string().nullable(),
  languages: z.array(z.string()),
  status: z.string(),
  onboardingStatus: z.string(),
  complianceStatus: z.string(),
  intelligenceScore: z.number().nullable(),
  performanceScore: z.number().nullable(),
  performanceBand: z.string().nullable(),
  latestActivity: z.string(),
  managerName: z.string().nullable(),
  platformBadges: z.array(z.string()),
  updatedAt: z.string(),
});

export type ManagerCreatorListItem = z.infer<typeof ManagerCreatorListItemSchema>;

export const ManagerCreatorListSchema = z.object({
  items: z.array(ManagerCreatorListItemSchema),
  nextCursor: z.string().nullable(),
  totalCount: z.number().int().nonnegative(),
});

export type ManagerCreatorList = z.infer<typeof ManagerCreatorListSchema>;

export const ManagerCreatorContactSchema = z.object({
  email: z.string().nullable(),
  phone: z.string().nullable(),
  country: z.string().nullable(),
  languages: z.array(z.string()),
});

export const ManagerCreatorProfileSectionSchema = z.object({
  displayName: z.string(),
  bio: z.string().nullable(),
  status: z.string(),
  commissionPlan: z.string().nullable(),
  recruiterName: z.string().nullable(),
  organizationName: z.string(),
});

export const ManagerCreatorPlatformAccountViewSchema = z.object({
  platform: z.string(),
  username: z.string(),
  followers: z.number().nullable(),
  verified: z.boolean(),
  status: z.string(),
});

export const ManagerCreatorSkillsSectionSchema = z.object({
  categories: z.array(z.string()),
  skills: z.array(z.string()),
  contentTypes: z.array(z.string()),
  languages: z.array(z.string()),
  experienceLevel: z.string().nullable(),
});

export const ManagerCreatorAvailabilitySectionSchema = z.object({
  timezone: z.string().nullable(),
  weeklySchedule: z.array(z.string()),
  preferredLiveTimes: z.array(z.string()),
  blackoutDates: z.array(z.string()),
  notes: z.string().nullable(),
});

export const ManagerCreatorComplianceSectionSchema = z.object({
  overallStatus: z.string(),
  missingDocuments: z.number().int(),
  expiringDocuments: z.number().int(),
  expiringContracts: z.number().int(),
});

export const ManagerCreatorOnboardingSectionSchema = z.object({
  overallStatus: z.string(),
  completionPercent: z.number().int().min(0).max(100),
  incompleteItems: z.array(z.string()),
});

export const ManagerCreatorGoalsSummarySchema = z.object({
  activeGoals: z.number().int(),
  completedGoals: z.number().int(),
  highlights: z.array(z.string()),
});

export const ManagerCreatorPerformanceSummarySchema = z.object({
  overallScore: z.number().nullable(),
  scoreBand: z.string().nullable(),
  strengths: z.array(z.string()),
  risks: z.array(z.string()),
});

export const ManagerCreatorIntelligenceSummarySchema = z.object({
  overallScore: z.number().nullable(),
  trendDirection: z.string().nullable(),
  highlights: z.array(z.string()),
});

export const ManagerCreatorCampaignSummaryItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  dueAt: z.string().nullable(),
});

export const ManagerCreatorLiveSummarySchema = z.object({
  latestSessionTitle: z.string().nullable(),
  latestSessionStatus: z.string().nullable(),
  scheduledCount: z.number().int(),
  openAlerts: z.number().int(),
});

export const ManagerCreatorDetailSchema = z.object({
  creatorId: z.string(),
  profile: ManagerCreatorProfileSectionSchema,
  contact: ManagerCreatorContactSchema,
  platformAccounts: z.array(ManagerCreatorPlatformAccountViewSchema),
  skills: ManagerCreatorSkillsSectionSchema,
  availability: ManagerCreatorAvailabilitySectionSchema,
  compliance: ManagerCreatorComplianceSectionSchema,
  onboarding: ManagerCreatorOnboardingSectionSchema,
  goalsSummary: ManagerCreatorGoalsSummarySchema,
  performanceSummary: ManagerCreatorPerformanceSummarySchema,
  intelligenceSummary: ManagerCreatorIntelligenceSummarySchema,
  recentCampaigns: z.array(ManagerCreatorCampaignSummaryItemSchema),
  liveSummary: ManagerCreatorLiveSummarySchema,
});

export type ManagerCreatorDetail = z.infer<typeof ManagerCreatorDetailSchema>;

export const ManagerCreatorManagementWorkspaceSchema = z.object({
  organizationId: z.string(),
  generatedAt: z.string(),
  list: ManagerCreatorListSchema,
});

export type ManagerCreatorManagementWorkspace = z.infer<
  typeof ManagerCreatorManagementWorkspaceSchema
>;

export type CreatorManagementSortField =
  'displayName' | 'status' | 'performanceScore' | 'intelligenceScore' | 'updatedAt';

export type CreatorManagementFilters = {
  status: string;
  country: string;
  language: string;
  platform: string;
  performanceBand: string;
  compliance: string;
};

export const DEFAULT_CREATOR_FILTERS: CreatorManagementFilters = {
  status: 'ALL',
  country: 'ALL',
  language: 'ALL',
  platform: 'ALL',
  performanceBand: 'ALL',
  compliance: 'ALL',
};

export type CreatorManagementDataSource = 'mock' | 'live' | 'empty' | 'partial';
