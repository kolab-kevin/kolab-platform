import type {
  CreatorComplianceOverallStatus,
  CreatorDashboardResponse,
  CreatorOnboardingChecklistResponse,
  CreatorPerformanceScore,
  LiveTrendOverallDirection,
} from '@kolab/types';

import {
  ACTIVE_CAMPAIGN_APPLICATION_STATUSES,
  ACTIVE_CAMPAIGN_ASSIGNMENT_STATUSES,
} from '../campaigns/campaigns.utils';
import { parseSessionCoachAlerts } from '../live-intelligence/live-intelligence-coach-alerts.utils';
import { parseCreatorIntelligenceProfile } from '../live-intelligence/live-intelligence-creator-profile.utils';
import { parseIntelligenceSnapshot } from '../live-intelligence/live-intelligence-engine.utils';
import { parseCreatorLiveTrendSnapshot } from '../live-intelligence/live-intelligence-live-trends.utils';
import { parseSessionRecommendations } from '../live-intelligence/live-intelligence-recommendations.utils';
import { computeProgressPercent, parseGoalValue } from './creators-goals.utils';
import { buildCreatorOnboardingChecklist } from './creators-onboarding.utils';
import { parseCreatorPerformanceScore } from './creators-performance-score.utils';

const QUICK_ACTION_PRIORITY_ORDER = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
} as const;

export type DashboardGoalRecord = {
  id: string;
  goalType: string;
  status: string;
  title: string | null;
  targetValue: { toString(): string };
  currentValue: { toString(): string };
  periodStart: Date;
  periodEnd: Date;
  updatedAt: Date;
};

export type DashboardAssignmentRecord = {
  id: string;
  status: string;
  campaign: {
    id: string;
    title: string;
    endsAt: Date | null;
    applicationDeadline: Date | null;
  };
};

export type DashboardApplicationRecord = {
  id: string;
  status: string;
  campaign: {
    id: string;
    title: string;
    endsAt: Date | null;
    applicationDeadline: Date | null;
  };
};

export type DashboardDeliverableRecord = {
  id: string;
  status: string;
  dueAt: Date | null;
  approvedAt: Date | null;
  updatedAt: Date;
  assignment: {
    campaign: {
      id: string;
      title: string;
    };
  };
};

export type DashboardLiveSessionRecord = {
  id: string;
  title: string;
  status: string;
  startedAt: Date | null;
  endedAt: Date | null;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  durationSeconds: number | null;
  totalGiftValue: { toString(): string } | null;
  metadata: unknown;
};

export type DashboardCreatorRecord = {
  id: string;
  organizationId: string;
  displayName: string | null;
  status: string;
  country: string | null;
  availability: unknown;
  metadata: unknown;
  platformAccounts: Array<{ id: string; status: string; platform: string; username: string }>;
};

export type DashboardOnboardingSource = {
  governmentIdDocument: { id: string; status: string } | null;
  creatorAgreement: { id: string; status: string; signedAt: Date | null } | null;
};

export type BuildCreatorDashboardInput = {
  creator: DashboardCreatorRecord;
  goals: DashboardGoalRecord[];
  assignments: DashboardAssignmentRecord[];
  applications: DashboardApplicationRecord[];
  deliverables: DashboardDeliverableRecord[];
  latestLiveSession: DashboardLiveSessionRecord | null;
  nextScheduledLiveSession: DashboardLiveSessionRecord | null;
  onboardingSource: DashboardOnboardingSource;
  generatedAt?: Date;
};

function isSameUtcDay(left: Date, right: Date): boolean {
  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  );
}

function isGoalActiveToday(goal: DashboardGoalRecord, now: Date): boolean {
  return (
    goal.status === 'ACTIVE' &&
    now.getTime() >= goal.periodStart.getTime() &&
    now.getTime() <= goal.periodEnd.getTime()
  );
}

function deriveDashboardComplianceStatus(
  onboarding: CreatorOnboardingChecklistResponse,
): CreatorComplianceOverallStatus {
  if (onboarding.overallStatus === 'INCOMPLETE') {
    return 'NON_COMPLIANT';
  }

  if (onboarding.overallStatus === 'WARNING') {
    return 'AT_RISK';
  }

  return 'COMPLIANT';
}

function buildTrendSummary(direction: LiveTrendOverallDirection | null): string | null {
  if (!direction) {
    return null;
  }

  switch (direction) {
    case 'IMPROVING':
      return 'Live performance trends are improving.';
    case 'DECLINING':
      return 'Live performance trends are declining.';
    case 'STABLE':
      return 'Live performance trends are stable.';
    default:
      return 'Insufficient live trend data to summarize performance direction.';
  }
}

function buildPerformanceMilestones(performanceScore: CreatorPerformanceScore | null): string[] {
  if (!performanceScore) {
    return [];
  }

  const milestones: string[] = [];

  if (performanceScore.scoreBand === 'EXCELLENT') {
    milestones.push('Maintained an excellent performance score band.');
  } else if (performanceScore.scoreBand === 'GOOD') {
    milestones.push('Achieved a good performance score band.');
  }

  if (performanceScore.overallScore >= 80) {
    milestones.push(`Overall performance score reached ${performanceScore.overallScore}.`);
  }

  return milestones;
}

function buildQuickActions(input: {
  onboarding: CreatorOnboardingChecklistResponse;
  overdueDeliverables: DashboardDeliverableRecord[];
  upcomingDeliverables: DashboardDeliverableRecord[];
  pendingApplications: DashboardApplicationRecord[];
  activeRecommendationsCount: number;
  latestLiveSession: DashboardLiveSessionRecord | null;
  nextScheduledLiveSession: DashboardLiveSessionRecord | null;
  now: Date;
}): CreatorDashboardResponse['quickActions'] {
  const actions: CreatorDashboardResponse['quickActions'] = [];

  if (input.onboarding.overallStatus === 'INCOMPLETE') {
    actions.push({
      action: 'FINISH_ONBOARDING',
      priority: 'HIGH',
      reason: 'Required onboarding steps are still incomplete.',
    });
  }

  if (input.overdueDeliverables.length > 0) {
    actions.push({
      action: 'COMPLETE_DELIVERABLE',
      priority: 'HIGH',
      reason: `${input.overdueDeliverables.length} deliverable(s) are overdue.`,
    });
  } else if (input.upcomingDeliverables.length > 0) {
    actions.push({
      action: 'COMPLETE_DELIVERABLE',
      priority: 'MEDIUM',
      reason: `${input.upcomingDeliverables.length} deliverable(s) are due soon.`,
    });
  }

  if (input.pendingApplications.length > 0) {
    actions.push({
      action: 'REVIEW_CAMPAIGN',
      priority: 'MEDIUM',
      reason: `${input.pendingApplications.length} campaign application(s) need attention.`,
    });
  }

  if (input.activeRecommendationsCount > 0) {
    actions.push({
      action: 'VIEW_RECOMMENDATIONS',
      priority: 'MEDIUM',
      reason: 'Active live coaching recommendations are available.',
    });
  }

  const wentLiveToday =
    input.latestLiveSession?.startedAt &&
    isSameUtcDay(input.latestLiveSession.startedAt, input.now);

  if (!wentLiveToday && !input.nextScheduledLiveSession) {
    actions.push({
      action: 'GO_LIVE',
      priority: 'HIGH',
      reason: 'No live session has started today.',
    });
  } else if (!wentLiveToday && input.nextScheduledLiveSession) {
    actions.push({
      action: 'GO_LIVE',
      priority: 'MEDIUM',
      reason: 'A live session is scheduled and has not started yet.',
    });
  }

  if (input.onboarding.overallStatus === 'WARNING') {
    actions.push({
      action: 'UPDATE_PROFILE',
      priority: 'LOW',
      reason: 'Optional profile or readiness items could be improved.',
    });
  }

  return actions.sort(
    (left, right) =>
      QUICK_ACTION_PRIORITY_ORDER[left.priority] - QUICK_ACTION_PRIORITY_ORDER[right.priority],
  );
}

export function buildCreatorDashboard(input: BuildCreatorDashboardInput): CreatorDashboardResponse {
  const now = input.generatedAt ?? new Date();
  const intelligenceProfile = parseCreatorIntelligenceProfile(
    input.creator.id,
    input.creator.metadata,
  );
  const liveTrendSnapshot = parseCreatorLiveTrendSnapshot(input.creator.id, input.creator.metadata);
  const performanceScore = parseCreatorPerformanceScore(input.creator.id, input.creator.metadata);

  const onboarding = buildCreatorOnboardingChecklist({
    creatorId: input.creator.id,
    organizationId: input.creator.organizationId,
    displayName: input.creator.displayName,
    country: input.creator.country,
    availability: input.creator.availability,
    metadata: input.creator.metadata,
    platformAccounts: input.creator.platformAccounts,
    governmentIdDocument: input.onboardingSource.governmentIdDocument,
    creatorAgreement: input.onboardingSource.creatorAgreement,
  });

  const requiredItems = onboarding.items.filter((item) => item.required);
  const completedRequired = requiredItems.filter((item) => item.status === 'COMPLETE').length;
  const onboardingCompletionPercent = requiredItems.length
    ? Math.round((completedRequired / requiredItems.length) * 100)
    : 100;

  const activeGoals = input.goals
    .filter((goal) => isGoalActiveToday(goal, now))
    .map((goal) => {
      const targetValue = parseGoalValue(goal.targetValue);
      const currentValue = parseGoalValue(goal.currentValue);

      return {
        id: goal.id,
        goalType:
          goal.goalType as CreatorDashboardResponse['todaysGoals']['activeGoals'][number]['goalType'],
        title: goal.title,
        targetValue: goal.targetValue.toString(),
        currentValue: goal.currentValue.toString(),
        progressPercent: computeProgressPercent(currentValue, targetValue),
        periodEnd: goal.periodEnd.toISOString(),
      };
    });

  const completedTodayGoals = input.goals.filter(
    (goal) => goal.status === 'COMPLETED' && isSameUtcDay(goal.updatedAt, now),
  );

  const upcomingDeliverables = input.deliverables.filter(
    (deliverable) =>
      deliverable.status !== 'APPROVED' &&
      deliverable.dueAt &&
      deliverable.dueAt.getTime() >= now.getTime(),
  );
  const overdueDeliverables = input.deliverables.filter(
    (deliverable) =>
      deliverable.status !== 'APPROVED' &&
      deliverable.dueAt &&
      deliverable.dueAt.getTime() < now.getTime(),
  );
  const completedTodayDeliverables = input.deliverables.filter(
    (deliverable) =>
      deliverable.status === 'APPROVED' &&
      deliverable.approvedAt &&
      isSameUtcDay(deliverable.approvedAt, now),
  );

  const assignedCampaigns = input.assignments
    .filter((assignment) =>
      (ACTIVE_CAMPAIGN_ASSIGNMENT_STATUSES as readonly string[]).includes(assignment.status),
    )
    .map((assignment) => ({
      assignmentId: assignment.id,
      campaignId: assignment.campaign.id,
      campaignTitle: assignment.campaign.title,
      status: assignment.status,
      dueAt: assignment.campaign.endsAt?.toISOString() ?? null,
    }));

  const pendingApplicationRecords = input.applications.filter((application) =>
    (ACTIVE_CAMPAIGN_APPLICATION_STATUSES as readonly string[]).includes(application.status),
  );

  const pendingApplications = pendingApplicationRecords.map((application) => ({
    applicationId: application.id,
    campaignId: application.campaign.id,
    campaignTitle: application.campaign.title,
    status: application.status,
    dueAt: application.campaign.applicationDeadline?.toISOString() ?? null,
  }));

  const dueDates = [...assignedCampaigns, ...pendingApplications]
    .flatMap((entry) => {
      if (!entry.dueAt) {
        return [];
      }

      return [
        {
          campaignId: entry.campaignId,
          label: entry.campaignTitle,
          dueAt: entry.dueAt,
        },
      ];
    })
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt));

  const latestSessionSnapshot = input.latestLiveSession
    ? parseIntelligenceSnapshot(input.latestLiveSession.id, input.latestLiveSession.metadata)
    : null;
  const recommendations = input.latestLiveSession
    ? parseSessionRecommendations(input.latestLiveSession.id, input.latestLiveSession.metadata)
    : null;
  const coachAlerts = input.latestLiveSession
    ? parseSessionCoachAlerts(input.latestLiveSession.id, input.latestLiveSession.metadata)
    : null;

  const activeRecommendations =
    recommendations?.recommendations.map((recommendation) => ({
      id: recommendation.id,
      recommendationType: recommendation.recommendationType,
      priority: recommendation.priority,
      title: recommendation.title,
      description: recommendation.description,
    })) ?? [];

  const activeAlerts =
    coachAlerts?.alerts.map((alert) => ({
      id: alert.id,
      alertType: alert.alertType,
      priority: alert.priority,
      title: alert.title,
      message: alert.message,
      recommendedAction: alert.recommendedAction,
    })) ?? [];

  const recentCompletedGoals = input.goals
    .filter((goal) => goal.status === 'COMPLETED')
    .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
    .slice(0, 5)
    .map((goal) => ({
      id: goal.id,
      goalType:
        goal.goalType as CreatorDashboardResponse['achievements']['recentCompletedGoals'][number]['goalType'],
      title: goal.title,
      completedAt: goal.updatedAt.toISOString(),
    }));

  return {
    creatorProfileId: input.creator.id,
    organizationId: input.creator.organizationId,
    generatedAt: now.toISOString(),
    overview: {
      creatorProfileId: input.creator.id,
      displayName: input.creator.displayName,
      profileStatus: input.creator.status,
      performanceScore: performanceScore?.overallScore ?? null,
      overallIntelligenceScore: intelligenceProfile?.overallScore ?? null,
      liveTrendDirection: liveTrendSnapshot?.overallDirection ?? null,
    },
    todaysGoals: {
      activeGoals,
      completedToday: completedTodayGoals.length,
      progressPercentages: activeGoals.map((goal) => goal.progressPercent),
    },
    upcomingCampaigns: {
      assignedCampaigns,
      pendingApplications,
      dueDates,
    },
    deliverables: {
      upcoming: upcomingDeliverables.map((deliverable) => ({
        id: deliverable.id,
        campaignId: deliverable.assignment.campaign.id,
        campaignTitle: deliverable.assignment.campaign.title,
        dueAt: deliverable.dueAt?.toISOString() ?? null,
        status: deliverable.status,
      })),
      overdue: overdueDeliverables.map((deliverable) => ({
        id: deliverable.id,
        campaignId: deliverable.assignment.campaign.id,
        campaignTitle: deliverable.assignment.campaign.title,
        dueAt: deliverable.dueAt?.toISOString() ?? null,
        status: deliverable.status,
      })),
      completedToday: completedTodayDeliverables.length,
    },
    liveActivity: {
      latestLiveSession: input.latestLiveSession
        ? {
            id: input.latestLiveSession.id,
            title: input.latestLiveSession.title,
            status: input.latestLiveSession.status,
            startedAt: input.latestLiveSession.startedAt?.toISOString() ?? null,
            endedAt: input.latestLiveSession.endedAt?.toISOString() ?? null,
            durationSeconds: input.latestLiveSession.durationSeconds,
            totalGiftValue: input.latestLiveSession.totalGiftValue?.toString() ?? null,
          }
        : null,
      nextScheduledLive: input.nextScheduledLiveSession
        ? {
            id: input.nextScheduledLiveSession.id,
            title: input.nextScheduledLiveSession.title,
            scheduledStart: input.nextScheduledLiveSession.scheduledStart?.toISOString() ?? null,
            scheduledEnd: input.nextScheduledLiveSession.scheduledEnd?.toISOString() ?? null,
            status: input.nextScheduledLiveSession.status,
          }
        : null,
      lastPerformanceScore:
        latestSessionSnapshot?.overallScore ?? performanceScore?.overallScore ?? null,
      sessionDuration: input.latestLiveSession?.durationSeconds ?? null,
      latestRevenue: input.latestLiveSession?.totalGiftValue?.toString() ?? null,
    },
    coach: {
      activeRecommendations,
      activeAlerts,
      topCoachingPriorities: intelligenceProfile?.coachingPriorities ?? [],
    },
    performance: {
      trendSummary: buildTrendSummary(liveTrendSnapshot?.overallDirection ?? null),
      strongestAreas: performanceScore?.strengths ?? [],
      weakestAreas:
        performanceScore && performanceScore.risks.length > 0
          ? performanceScore.risks
          : (intelligenceProfile?.weakestTriggerTypes.map((entry) => entry.triggerType) ?? []),
    },
    achievements: {
      recentCompletedGoals,
      newPerformanceMilestones: buildPerformanceMilestones(performanceScore),
    },
    compliance: {
      onboardingCompletionPercent,
      onboardingStatus: onboarding.overallStatus,
      complianceStatus: deriveDashboardComplianceStatus(onboarding),
      missingRequirements: onboarding.items
        .filter((item) => item.status !== 'COMPLETE')
        .map((item) => item.label),
    },
    quickActions: buildQuickActions({
      onboarding,
      overdueDeliverables,
      upcomingDeliverables,
      pendingApplications: pendingApplicationRecords,
      activeRecommendationsCount: activeRecommendations.length,
      latestLiveSession: input.latestLiveSession,
      nextScheduledLiveSession: input.nextScheduledLiveSession,
      now,
    }),
  };
}
