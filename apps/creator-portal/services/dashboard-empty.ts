import type { CreatorDashboardResponse } from '@kolab/types';

export function createEmptyDashboard(
  creatorProfileId: string,
  organizationId = 'unknown',
): CreatorDashboardResponse {
  const generatedAt = new Date().toISOString();

  return {
    creatorProfileId,
    organizationId,
    generatedAt,
    overview: {
      creatorProfileId,
      displayName: null,
      profileStatus: 'ACTIVE',
      performanceScore: null,
      overallIntelligenceScore: null,
      liveTrendDirection: null,
    },
    todaysGoals: {
      activeGoals: [],
      completedToday: 0,
      progressPercentages: [],
    },
    upcomingCampaigns: {
      assignedCampaigns: [],
      pendingApplications: [],
      dueDates: [],
    },
    deliverables: {
      upcoming: [],
      overdue: [],
      completedToday: 0,
    },
    liveActivity: {
      latestLiveSession: null,
      nextScheduledLive: null,
      lastPerformanceScore: null,
      sessionDuration: null,
      latestRevenue: null,
    },
    coach: {
      activeRecommendations: [],
      activeAlerts: [],
      topCoachingPriorities: [],
    },
    performance: {
      trendSummary: null,
      strongestAreas: [],
      weakestAreas: [],
    },
    achievements: {
      recentCompletedGoals: [],
      newPerformanceMilestones: [],
    },
    compliance: {
      onboardingCompletionPercent: 0,
      onboardingStatus: 'INCOMPLETE',
      complianceStatus: 'COMPLIANT',
      missingRequirements: [],
    },
    quickActions: [],
  };
}
