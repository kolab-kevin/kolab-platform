import type { CreatorPerformanceScore } from '@kolab/types';

import { buildCreatorDashboard } from './creators-dashboard.utils';

describe('creators-dashboard.utils', () => {
  const generatedAt = new Date('2026-07-04T18:00:00.000Z');

  const baseCreator = {
    id: 'creator-1',
    organizationId: 'org-1',
    displayName: 'Creator One',
    status: 'ACTIVE',
    country: 'US',
    availability: { monday: ['18:00'] },
    metadata: {},
    platformAccounts: [
      { id: 'account-1', status: 'ACTIVE', platform: 'TIKTOK', username: 'creatorone' },
    ],
  };

  const performanceScore: CreatorPerformanceScore = {
    creatorProfileId: 'creator-1',
    generatedAt: '2026-07-04T12:00:00.000Z',
    overallScore: 82,
    scoreBand: 'GOOD',
    reliabilityScore: 80,
    revenueScore: 84,
    engagementScore: 78,
    consistencyScore: 76,
    complianceScore: 90,
    campaignExecutionScore: 70,
    growthScore: 75,
    riskScore: 20,
    strengths: ['Strong revenue consistency'],
    risks: ['Campaign execution lagging'],
    recommendedActions: ['Submit pending deliverables'],
    dataQualityWarnings: [],
  };

  it('builds an empty dashboard when optional data is missing', () => {
    const dashboard = buildCreatorDashboard({
      creator: baseCreator,
      goals: [],
      assignments: [],
      applications: [],
      deliverables: [],
      latestLiveSession: null,
      nextScheduledLiveSession: null,
      onboardingSource: {
        governmentIdDocument: null,
        creatorAgreement: null,
      },
      generatedAt,
    });

    expect(dashboard.creatorProfileId).toBe('creator-1');
    expect(dashboard.overview.performanceScore).toBeNull();
    expect(dashboard.todaysGoals.activeGoals).toEqual([]);
    expect(dashboard.upcomingCampaigns.assignedCampaigns).toEqual([]);
    expect(dashboard.liveActivity.latestLiveSession).toBeNull();
    expect(dashboard.coach.activeRecommendations).toEqual([]);
    expect(dashboard.compliance.missingRequirements.length).toBeGreaterThan(0);
    expect(dashboard.quickActions.some((action) => action.action === 'FINISH_ONBOARDING')).toBe(
      true,
    );
  });

  it('builds a completed dashboard from existing aggregates', () => {
    const dashboard = buildCreatorDashboard({
      creator: {
        ...baseCreator,
        metadata: {
          skills: { skills: ['live hosting'], categories: ['entertainment'] },
          intelligenceProfile: {
            creatorProfileId: 'creator-1',
            generatedAt: generatedAt.toISOString(),
            sessionsAnalyzed: 5,
            dateRange: { from: '2026-06-01T00:00:00.000Z', to: '2026-07-04T00:00:00.000Z' },
            creatorHealthScore: 80,
            revenueTrendScore: 78,
            engagementTrendScore: 74,
            gifterRetentionScore: 70,
            consistencyScore: 76,
            campaignReadinessScore: 72,
            overallScore: 75,
            strongestTriggerTypes: [
              { triggerType: 'SONG_STARTED', count: 3, averageGiftValue: 10 },
            ],
            weakestTriggerTypes: [{ triggerType: 'PK_STARTED', count: 1, averageGiftValue: 5 }],
            topGifters: [],
            bestLivePatterns: [],
            riskSignals: [],
            coachingPriorities: ['Improve campaign follow-through'],
            recommendedNextActions: [],
            dataQualityWarnings: [],
          },
          liveTrendSnapshot: {
            creatorProfileId: 'creator-1',
            generatedAt: generatedAt.toISOString(),
            sessionsAnalyzed: 5,
            dateRange: { from: '2026-06-01T00:00:00.000Z', to: '2026-07-04T00:00:00.000Z' },
            revenueTrend: {
              metric: 'revenue',
              direction: 'UP',
              currentValue: 80,
              previousValue: 60,
              percentChange: 33.33,
              confidenceScore: 0.85,
              evidence: [],
            },
            engagementTrend: {
              metric: 'engagement',
              direction: 'UP',
              currentValue: 75,
              previousValue: 65,
              percentChange: 15.38,
              confidenceScore: 0.85,
              evidence: [],
            },
            consistencyTrend: {
              metric: 'consistency',
              direction: 'FLAT',
              currentValue: 78,
              previousValue: 76,
              percentChange: 2.63,
              confidenceScore: 0.85,
              evidence: [],
            },
            gifterQualityTrend: {
              metric: 'gifterQuality',
              direction: 'UP',
              currentValue: 70,
              previousValue: 60,
              percentChange: 16.67,
              confidenceScore: 0.85,
              evidence: [],
            },
            triggerEffectivenessTrend: {
              metric: 'triggerEffectiveness',
              direction: 'UP',
              currentValue: 40,
              previousValue: 25,
              percentChange: 60,
              confidenceScore: 0.85,
              evidence: [],
            },
            overallDirection: 'IMPROVING',
            trendSignals: [],
            regressionRisks: [],
            positiveMomentum: [],
            recommendedFocusAreas: [],
            dataQualityWarnings: [],
          },
          performanceScore,
        },
      },
      goals: [
        {
          id: 'goal-1',
          goalType: 'LIVE_HOURS',
          status: 'ACTIVE',
          title: 'July hours',
          targetValue: { toString: () => '20.00' },
          currentValue: { toString: () => '10.00' },
          periodStart: new Date('2026-07-01T00:00:00.000Z'),
          periodEnd: new Date('2026-07-31T23:59:59.000Z'),
          updatedAt: generatedAt,
        },
        {
          id: 'goal-2',
          goalType: 'LIVE_DAYS',
          status: 'COMPLETED',
          title: 'July days',
          targetValue: { toString: () => '5.00' },
          currentValue: { toString: () => '5.00' },
          periodStart: new Date('2026-07-01T00:00:00.000Z'),
          periodEnd: new Date('2026-07-31T23:59:59.000Z'),
          updatedAt: generatedAt,
        },
      ],
      assignments: [
        {
          id: 'assignment-1',
          status: 'IN_PROGRESS',
          campaign: {
            id: 'campaign-1',
            title: 'Summer Brand Deal',
            endsAt: new Date('2026-07-20T00:00:00.000Z'),
            applicationDeadline: null,
          },
        },
      ],
      applications: [
        {
          id: 'application-1',
          status: 'INVITED',
          campaign: {
            id: 'campaign-2',
            title: 'Shop Launch',
            endsAt: null,
            applicationDeadline: new Date('2026-07-10T00:00:00.000Z'),
          },
        },
      ],
      deliverables: [
        {
          id: 'deliverable-1',
          status: 'IN_PROGRESS',
          dueAt: new Date('2026-07-05T00:00:00.000Z'),
          approvedAt: null,
          updatedAt: generatedAt,
          assignment: {
            campaign: {
              id: 'campaign-1',
              title: 'Summer Brand Deal',
            },
          },
        },
      ],
      latestLiveSession: {
        id: 'session-1',
        title: 'Evening Live',
        status: 'ENDED',
        startedAt: new Date('2026-07-04T16:00:00.000Z'),
        endedAt: new Date('2026-07-04T17:00:00.000Z'),
        scheduledStart: null,
        scheduledEnd: null,
        durationSeconds: 3600,
        totalGiftValue: { toString: () => '1500.00' },
        metadata: {
          intelligenceSnapshot: {
            sessionId: 'session-1',
            generatedAt: generatedAt.toISOString(),
            overallScore: 79,
            engagementScore: 74,
            revenueScore: 82,
            consistencyScore: 70,
            coachingOpportunityScore: 68,
            topSignals: [],
            topGifters: [],
            topTriggerTypes: [],
            bestMoments: [],
            weakMoments: [],
            recommendedNextActions: [],
            dataQualityWarnings: [],
          },
          recommendations: {
            sessionId: 'session-1',
            generatedAt: generatedAt.toISOString(),
            recommendations: [
              {
                id: 'rec-1',
                recommendationType: 'THANK_TOP_SUPPORTERS',
                priority: 'HIGH',
                confidenceScore: 0.9,
                title: 'Thank top supporters',
                description: 'Recognize recent high-value supporters.',
                supportingEvidence: [],
                generatedAt: generatedAt.toISOString(),
              },
            ],
          },
          coachAlerts: {
            sessionId: 'session-1',
            generatedAt: generatedAt.toISOString(),
            alerts: [
              {
                id: 'alert-1',
                alertType: 'THANK_SUPPORTER',
                priority: 'HIGH',
                title: 'Thank a top supporter now',
                message: 'A high-tier supporter is active.',
                recommendedAction: 'Deliver a direct thank-you.',
                relatedRecommendationId: 'rec-1',
                relatedEventIds: ['event-1'],
                confidenceScore: 0.9,
                generatedAt: generatedAt.toISOString(),
              },
            ],
          },
          events: [
            {
              id: 'chat-1',
              eventType: 'CHAT_MESSAGE',
              payload: { message: 'secret chat content' },
            },
          ],
        },
      },
      nextScheduledLiveSession: {
        id: 'session-2',
        title: 'Tomorrow Live',
        status: 'SCHEDULED',
        startedAt: null,
        endedAt: null,
        scheduledStart: new Date('2026-07-05T18:00:00.000Z'),
        scheduledEnd: new Date('2026-07-05T19:00:00.000Z'),
        durationSeconds: null,
        totalGiftValue: null,
        metadata: {},
      },
      onboardingSource: {
        governmentIdDocument: { id: 'doc-1', status: 'APPROVED' },
        creatorAgreement: { id: 'contract-1', status: 'SIGNED', signedAt: generatedAt },
      },
      generatedAt,
    });

    expect(dashboard.overview.performanceScore).toBe(82);
    expect(dashboard.overview.overallIntelligenceScore).toBe(75);
    expect(dashboard.overview.liveTrendDirection).toBe('IMPROVING');
    expect(dashboard.todaysGoals.activeGoals).toHaveLength(1);
    expect(dashboard.todaysGoals.completedToday).toBe(1);
    expect(dashboard.upcomingCampaigns.assignedCampaigns).toHaveLength(1);
    expect(dashboard.deliverables.upcoming).toHaveLength(1);
    expect(dashboard.liveActivity.latestRevenue).toBe('1500.00');
    expect(dashboard.coach.activeRecommendations).toHaveLength(1);
    expect(dashboard.coach.topCoachingPriorities).toContain('Improve campaign follow-through');
    expect(dashboard.performance.strongestAreas).toContain('Strong revenue consistency');
    expect(dashboard.achievements.recentCompletedGoals).toHaveLength(1);
    expect(dashboard.compliance.complianceStatus).toBe('COMPLIANT');
    expect(dashboard.quickActions.length).toBeGreaterThan(0);
    expect(dashboard.quickActions[0]?.priority).toBe('MEDIUM');
  });

  it('does not leak raw chat or event payloads in dashboard output', () => {
    const dashboard = buildCreatorDashboard({
      creator: baseCreator,
      goals: [],
      assignments: [],
      applications: [],
      deliverables: [],
      latestLiveSession: {
        id: 'session-1',
        title: 'Evening Live',
        status: 'ENDED',
        startedAt: new Date('2026-07-04T16:00:00.000Z'),
        endedAt: new Date('2026-07-04T17:00:00.000Z'),
        scheduledStart: null,
        scheduledEnd: null,
        durationSeconds: 3600,
        totalGiftValue: { toString: () => '1500.00' },
        metadata: {
          events: [
            {
              id: 'chat-1',
              eventType: 'CHAT_MESSAGE',
              payload: { message: 'secret chat content' },
            },
          ],
        },
      },
      nextScheduledLiveSession: null,
      onboardingSource: {
        governmentIdDocument: null,
        creatorAgreement: null,
      },
      generatedAt,
    });

    const serialized = JSON.stringify(dashboard);

    expect(serialized).not.toContain('secret chat content');
    expect(serialized).not.toContain('CHAT_MESSAGE');
    expect(serialized).not.toContain('relatedEventIds');
    expect(serialized).not.toContain('chatMessageCount');
    expect(serialized).not.toContain('VOICE_TRANSCRIPT');
  });
});
