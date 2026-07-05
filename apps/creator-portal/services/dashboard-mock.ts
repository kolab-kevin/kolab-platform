import type { CreatorDashboardResponse } from '@kolab/types';

export function createMockDashboard(creatorProfileId: string): CreatorDashboardResponse {
  const now = new Date();
  const generatedAt = now.toISOString();
  const periodEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const dueAt = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();

  return {
    creatorProfileId,
    organizationId: 'org_mock_001',
    generatedAt,
    overview: {
      creatorProfileId,
      displayName: 'Alex Rivera',
      profileStatus: 'ACTIVE',
      performanceScore: 82,
      overallIntelligenceScore: 75,
      liveTrendDirection: 'IMPROVING',
    },
    todaysGoals: {
      activeGoals: [
        {
          id: 'goal_1',
          goalType: 'LIVE_DAYS',
          title: 'Stream 4 days this week',
          targetValue: '4',
          currentValue: '2',
          progressPercent: 50,
          periodEnd,
        },
        {
          id: 'goal_2',
          goalType: 'GIFT_VALUE',
          title: 'Weekly gift revenue target',
          targetValue: '5000',
          currentValue: '3200',
          progressPercent: 64,
          periodEnd,
        },
      ],
      completedToday: 0,
      progressPercentages: [50, 64],
    },
    upcomingCampaigns: {
      assignedCampaigns: [
        {
          assignmentId: 'assign_1',
          campaignId: 'camp_1',
          campaignTitle: 'Summer Beauty Launch',
          status: 'ACTIVE',
          dueAt,
        },
      ],
      pendingApplications: [],
      dueDates: [
        {
          campaignId: 'camp_1',
          label: 'Summer Beauty Launch — deliverable due',
          dueAt,
        },
      ],
    },
    deliverables: {
      upcoming: [
        {
          id: 'del_1',
          campaignId: 'camp_1',
          campaignTitle: 'Summer Beauty Launch',
          dueAt,
          status: 'PENDING',
        },
      ],
      overdue: [],
      completedToday: 0,
    },
    liveActivity: {
      latestLiveSession: {
        id: 'session_1',
        title: 'Evening Q&A',
        status: 'ENDED',
        startedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        endedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        durationSeconds: 3600,
        totalGiftValue: '1250.00',
      },
      nextScheduledLive: {
        id: 'schedule_1',
        title: 'Product demo live',
        scheduledStart: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
        scheduledEnd: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
        status: 'SCHEDULED',
      },
      lastPerformanceScore: 78,
      sessionDuration: 3600,
      latestRevenue: '1250.00',
    },
    coach: {
      activeRecommendations: [
        {
          id: 'rec_1',
          recommendationType: 'THANK_SUPPORTER',
          priority: 'HIGH',
          title: 'Thank your top gifter',
          description: 'A high-value supporter was active in your last session.',
        },
      ],
      activeAlerts: [
        {
          id: 'alert_1',
          alertType: 'GIFT_VELOCITY_DROPPING',
          priority: 'MEDIUM',
          title: 'Gift pace slowing',
          message: 'Gift velocity dropped compared to your session average.',
          recommendedAction: 'Try an engagement prompt or short performance segment.',
        },
      ],
      topCoachingPriorities: ['Maintain consistency', 'Follow up with top gifters'],
    },
    performance: {
      trendSummary: 'Engagement and revenue trends are improving over the last 5 sessions.',
      strongestAreas: ['Consistency', 'Gifter retention'],
      weakestAreas: ['Campaign deliverable timeliness'],
    },
    achievements: {
      recentCompletedGoals: [],
      newPerformanceMilestones: ['Crossed 80 performance score'],
    },
    compliance: {
      onboardingCompletionPercent: 85,
      onboardingStatus: 'INCOMPLETE',
      complianceStatus: 'COMPLIANT',
      missingRequirements: ['Upload signed contract PDF'],
    },
    quickActions: [
      {
        action: 'GO_LIVE',
        priority: 'HIGH',
        reason: 'You have a scheduled live session starting soon.',
      },
      {
        action: 'COMPLETE_DELIVERABLE',
        priority: 'HIGH',
        reason: 'One deliverable is due within 48 hours.',
      },
      {
        action: 'VIEW_RECOMMENDATIONS',
        priority: 'MEDIUM',
        reason: 'New coaching recommendations are available.',
      },
    ],
  };
}
