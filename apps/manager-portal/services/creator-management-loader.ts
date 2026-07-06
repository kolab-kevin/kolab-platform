import {
  type CreatorComplianceResponse,
  CreatorComplianceResponseSchema,
  type CreatorDashboardResponse,
  CreatorDashboardResponseSchema,
  type CreatorDetailResponse,
  CreatorDetailResponseSchema,
  type CreatorIntelligenceProfile,
  CreatorIntelligenceProfileSchema,
  type CreatorPerformanceScore,
  CreatorPerformanceScoreSchema,
  type CreatorSkills,
  CreatorSkillsSchema,
  type CreatorStructuredAvailability,
  CreatorStructuredAvailabilitySchema,
  type ListCreatorGoalsResponse,
  ListCreatorGoalsResponseSchema,
} from '@kolab/types';

import type { CreatorManagementDataSource, ManagerCreatorDetail } from '@/types/creator-management';

import { apiClient, isApiClientError } from './api-client';
import { CreatorManagementApiError } from './creator-management-errors';

function getCreatorPath(creatorId: string): string {
  return `/api/creators/${creatorId}`;
}

async function fetchOptional<T>(
  path: string,
  schema: { parse: (value: unknown) => T },
): Promise<T | null> {
  try {
    const data = await apiClient.get<unknown>(path);
    return schema.parse(data);
  } catch {
    return null;
  }
}

export async function loadCreatorManagementDetail(
  creatorId: string,
): Promise<{ detail: ManagerCreatorDetail | null; source: CreatorManagementDataSource }> {
  try {
    const [
      detailResponse,
      skills,
      availability,
      compliance,
      goals,
      performance,
      intelligence,
      dashboard,
    ] = await Promise.all([
      apiClient.get<unknown>(getCreatorPath(creatorId)),
      fetchOptional(`${getCreatorPath(creatorId)}/skills`, CreatorSkillsSchema),
      fetchOptional(
        `${getCreatorPath(creatorId)}/availability`,
        CreatorStructuredAvailabilitySchema,
      ),
      fetchOptional(`${getCreatorPath(creatorId)}/compliance`, CreatorComplianceResponseSchema),
      fetchOptional(`${getCreatorPath(creatorId)}/goals`, ListCreatorGoalsResponseSchema),
      fetchOptional(
        `${getCreatorPath(creatorId)}/performance-score`,
        CreatorPerformanceScoreSchema,
      ),
      fetchOptional(`${getCreatorPath(creatorId)}/intelligence`, CreatorIntelligenceProfileSchema),
      fetchOptional(`${getCreatorPath(creatorId)}/dashboard`, CreatorDashboardResponseSchema),
    ]);

    const detail = CreatorDetailResponseSchema.parse(detailResponse);
    const mapped = mapLiveDetail(
      creatorId,
      detail,
      skills,
      availability,
      compliance,
      goals,
      performance,
      intelligence,
      dashboard,
    );

    const partial =
      !skills ||
      !availability ||
      !compliance ||
      !goals ||
      !performance ||
      !intelligence ||
      !dashboard;

    return {
      detail: mapped,
      source: partial ? 'partial' : 'live',
    };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new CreatorManagementApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return { detail: null, source: 'empty' };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load creator detail');
  }
}

function mapLiveDetail(
  creatorId: string,
  detail: CreatorDetailResponse,
  skills: CreatorSkills | null,
  availability: CreatorStructuredAvailability | null,
  compliance: CreatorComplianceResponse | null,
  goals: ListCreatorGoalsResponse | null,
  performance: CreatorPerformanceScore | null,
  intelligence: CreatorIntelligenceProfile | null,
  dashboard: CreatorDashboardResponse | null,
): ManagerCreatorDetail {
  const activeGoals = goals?.items.filter((goal) => goal.status === 'ACTIVE') ?? [];
  const completedGoals = goals?.items.filter((goal) => goal.status === 'COMPLETED') ?? [];

  return {
    creatorId,
    profile: {
      displayName: detail.creator.displayName,
      bio: detail.creator.bio,
      status: detail.creator.status,
      commissionPlan: detail.creator.commissionPlan,
      recruiterName: detail.recruiter?.displayName ?? detail.recruiter?.nickname ?? null,
      organizationName: detail.organization.name,
    },
    contact: {
      email: detail.user.email,
      phone: detail.creator.phone,
      country: detail.creator.country,
      languages: detail.creator.languages,
    },
    platformAccounts: detail.platformAccounts.map((account) => ({
      platform: account.platform,
      username: account.username,
      followers: account.followers,
      verified: account.verified,
      status: account.status,
    })),
    skills: {
      categories: skills?.categories ?? [],
      skills: skills?.skills ?? [],
      contentTypes: skills?.contentTypes ?? [],
      languages: skills?.languages ?? [],
      experienceLevel: skills?.experienceLevel ?? null,
    },
    availability: {
      timezone: availability?.timezone ?? null,
      weeklySchedule:
        availability?.weeklySchedule.map(
          (entry) => `Day ${entry.weekday} ${entry.start}-${entry.end}`,
        ) ?? [],
      preferredLiveTimes: availability?.preferredLiveTimes ?? [],
      blackoutDates: availability?.blackoutDates ?? [],
      notes: availability?.notes ?? null,
    },
    compliance: {
      overallStatus: compliance?.overallStatus ?? '—',
      missingDocuments: compliance?.documents.missing ?? 0,
      expiringDocuments: compliance?.documents.expiring ?? 0,
      expiringContracts: compliance?.contracts.expiring ?? 0,
    },
    onboarding: {
      overallStatus: compliance?.onboarding.overallStatus ?? '—',
      completionPercent: dashboard?.compliance.onboardingCompletionPercent ?? 0,
      incompleteItems:
        compliance?.onboarding.items
          .filter((item) => item.status !== 'COMPLETE')
          .map((item) => item.label) ?? [],
    },
    goalsSummary: {
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      highlights: activeGoals.slice(0, 3).map((goal) => goal.title ?? goal.goalType),
    },
    performanceSummary: {
      overallScore: performance?.overallScore ?? dashboard?.overview.performanceScore ?? null,
      scoreBand: performance?.scoreBand ?? null,
      strengths: performance?.strengths ?? [],
      risks: performance?.risks ?? [],
    },
    intelligenceSummary: {
      overallScore:
        intelligence?.overallScore ?? dashboard?.overview.overallIntelligenceScore ?? null,
      trendDirection: dashboard?.overview.liveTrendDirection ?? null,
      highlights: intelligence?.recommendedNextActions?.slice(0, 3) ?? [],
    },
    recentCampaigns:
      dashboard?.upcomingCampaigns.assignedCampaigns.slice(0, 5).map((campaign) => ({
        id: campaign.campaignId,
        title: campaign.campaignTitle,
        status: campaign.status,
        dueAt: campaign.dueAt,
      })) ?? [],
    liveSummary: {
      latestSessionTitle: dashboard?.liveActivity.latestLiveSession?.title ?? null,
      latestSessionStatus: dashboard?.liveActivity.latestLiveSession?.status ?? null,
      scheduledCount: dashboard?.liveActivity.nextScheduledLive ? 1 : 0,
      openAlerts: dashboard?.coach.activeAlerts.length ?? 0,
    },
  };
}
