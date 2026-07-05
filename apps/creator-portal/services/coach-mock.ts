import type {
  CreatorIntelligenceProfile,
  SessionCoachAlertsResponse,
  SessionIntelligenceSnapshot,
  SessionRecommendationsResponse,
} from '@kolab/types';

const now = new Date();
const iso = (offsetHours: number) =>
  new Date(now.getTime() + offsetHours * 60 * 60 * 1000).toISOString();

export const MOCK_COACH_SESSION_ID = 'session_1';

export function createMockSessionRecommendations(
  sessionId: string = MOCK_COACH_SESSION_ID,
): SessionRecommendationsResponse {
  return {
    sessionId,
    generatedAt: iso(-1),
    recommendations: [
      {
        id: 'rec_high_1',
        recommendationType: 'THANK_TOP_SUPPORTERS',
        priority: 'HIGH',
        confidenceScore: 0.91,
        title: 'Thank your top gifter',
        description: 'A high-value supporter was active in your last session.',
        supportingEvidence: ['Top gifter sent 3 gifts in the last 10 minutes.'],
        generatedAt: iso(-1),
      },
      {
        id: 'rec_medium_1',
        recommendationType: 'TRY_MUSIC',
        priority: 'MEDIUM',
        confidenceScore: 0.74,
        title: 'Try background music',
        description: 'Music segments correlated with higher engagement in recent sessions.',
        supportingEvidence: ['Engagement score increased 12% during music segments.'],
        generatedAt: iso(-2),
      },
      {
        id: 'rec_low_1',
        recommendationType: 'WELCOME_NEW_VIEWERS',
        priority: 'LOW',
        confidenceScore: 0.58,
        title: 'Welcome new viewers',
        description: 'Viewer arrivals increased during your opening segment.',
        supportingEvidence: ['12 new viewers joined in the first 15 minutes.'],
        generatedAt: iso(-3),
      },
    ],
  };
}

export function createMockSessionCoachAlerts(
  sessionId: string = MOCK_COACH_SESSION_ID,
): SessionCoachAlertsResponse {
  return {
    sessionId,
    generatedAt: iso(-1),
    alerts: [
      {
        id: 'alert_high_1',
        alertType: 'HIGH_VALUE_GIFT_RECEIVED',
        priority: 'HIGH',
        title: 'High-value gift received',
        message: 'A whale-tier supporter sent a high-value gift.',
        recommendedAction: 'Thank the supporter and acknowledge the gift on stream.',
        relatedRecommendationId: 'rec_high_1',
        relatedEventIds: ['event_gift_1'],
        confidenceScore: 0.88,
        generatedAt: iso(-1),
      },
      {
        id: 'alert_medium_1',
        alertType: 'GIFT_VELOCITY_DROPPING',
        priority: 'MEDIUM',
        title: 'Gift pace slowing',
        message: 'Gift velocity dropped compared to your session average.',
        recommendedAction: 'Try an engagement prompt or short performance segment.',
        relatedRecommendationId: 'rec_medium_1',
        relatedEventIds: ['event_velocity_1'],
        confidenceScore: 0.72,
        generatedAt: iso(-2),
      },
      {
        id: 'alert_low_1',
        alertType: 'VIEWER_SPIKE',
        priority: 'LOW',
        title: 'Viewer spike detected',
        message: 'Concurrent viewers increased briefly during the last segment.',
        recommendedAction: 'Keep the current pacing and welcome newcomers.',
        relatedRecommendationId: null,
        relatedEventIds: ['event_viewer_1'],
        confidenceScore: 0.61,
        generatedAt: iso(-3),
      },
    ],
  };
}

export function createMockSessionIntelligence(
  creatorProfileId: string,
  sessionId: string = MOCK_COACH_SESSION_ID,
): SessionIntelligenceSnapshot {
  return {
    sessionId,
    creatorProfileId,
    generatedAt: iso(-1),
    sessionHealthScore: 82,
    revenueScore: 78,
    engagementScore: 80,
    consistencyScore: 76,
    gifterQualityScore: 84,
    coachingOpportunityScore: 71,
    overallScore: 79,
    keyStrengths: ['Strong gifter retention', 'Consistent engagement pacing'],
    keyRisks: ['Gift velocity dipped mid-session'],
    topSignals: [
      {
        signalType: 'GIFT_VELOCITY',
        label: 'Gift velocity',
        value: 72,
        relatedEventIds: ['event_velocity_1'],
      },
    ],
    topGifters: [
      {
        gifterProfileId: 'gifter_1',
        externalGifterId: 'ext_gifter_1',
        displayName: 'LunaStar',
        giftCount: 5,
        giftValue: 420,
        spendingTier: 'WHALE',
      },
    ],
    topTriggerTypes: [{ triggerType: 'GIFT', count: 8 }],
    bestMoments: [
      { type: 'ENGAGEMENT_PEAK', label: 'Opening segment', offsetMs: 900000, eventIds: [] },
    ],
    weakMoments: [
      { type: 'GIFT_DROP', label: 'Mid-session lull', offsetMs: 2400000, eventIds: [] },
    ],
    recommendedNextActions: ['Thank top supporters', 'Schedule a follow-up live within 48 hours'],
    dataQualityWarnings: [],
  };
}

export function createMockCreatorIntelligence(
  creatorProfileId: string,
): CreatorIntelligenceProfile {
  return {
    creatorProfileId,
    generatedAt: iso(-1),
    sessionsAnalyzed: 12,
    dateRange: {
      from: iso(-24 * 14),
      to: iso(0),
    },
    creatorHealthScore: 81,
    revenueTrendScore: 77,
    engagementTrendScore: 79,
    gifterRetentionScore: 83,
    consistencyScore: 75,
    campaignReadinessScore: 72,
    overallScore: 78,
    strongestTriggerTypes: [{ triggerType: 'GIFT', count: 42, averageGiftValue: 18.5 }],
    weakestTriggerTypes: [{ triggerType: 'COMMENT', count: 6, averageGiftValue: null }],
    topGifters: [
      {
        gifterProfileId: 'gifter_1',
        externalGifterId: 'ext_gifter_1',
        displayName: 'LunaStar',
        giftCount: 18,
        giftValue: 1260,
        spendingTier: 'WHALE',
        sessionCount: 4,
      },
    ],
    bestLivePatterns: [
      { patternType: 'EVENING_STREAM', label: 'Evening streams', sessionCount: 7 },
    ],
    riskSignals: ['Campaign deliverable timeliness could improve'],
    coachingPriorities: ['Maintain consistency', 'Follow up with top gifters'],
    recommendedNextActions: ['Review campaign deliverables', 'Plan next live session'],
    dataQualityWarnings: [],
  };
}
