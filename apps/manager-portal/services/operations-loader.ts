import {
  ListCreatorsResponseSchema,
  ListExpiringCreatorContractsResponseSchema,
  ListExpiringCreatorDocumentsResponseSchema,
} from '@kolab/types';

import { fetchActivityFeed } from './activity-feed-service';
import { fetchAgencyLiveSessions, fetchSessionCoachBundle } from './agency-live-service';
import { apiClient } from './api-client';
import { fetchCampaignBoardList } from './campaign-board-service';
import { fetchRecruitmentPipeline } from './recruitment-pipeline-service';

const MAX_LIVE_COACH_SESSIONS = 6;

export async function loadOperationsCenterSources() {
  const [
    campaignsResult,
    leadsResult,
    agencySessions,
    creatorsResponse,
    activityFeed,
    expiringDocuments,
    expiringContracts,
  ] = await Promise.all([
    fetchCampaignBoardList({ limit: 50 }),
    fetchRecruitmentPipeline({ limit: 100 }),
    fetchAgencyLiveSessions(),
    apiClient.get<unknown>('/api/creators?limit=100').catch(() => ({ items: [] })),
    fetchActivityFeed(),
    apiClient
      .get<unknown>('/api/creators/documents/expiring?limit=20')
      .then((data) => ListExpiringCreatorDocumentsResponseSchema.safeParse(data))
      .catch(() => null),
    apiClient
      .get<unknown>('/api/creators/contracts/expiring?limit=20')
      .then((data) => ListExpiringCreatorContractsResponseSchema.safeParse(data))
      .catch(() => null),
  ]);

  const creators = ListCreatorsResponseSchema.safeParse(creatorsResponse);
  const creatorNames = creators.success
    ? new Map(creators.data.items.map((creator) => [creator.id, creator.displayName]))
    : new Map<string, string>();

  const liveSessions = agencySessions.items.filter((session) => session.status === 'LIVE');
  const coachAlerts = await Promise.all(
    liveSessions.slice(0, MAX_LIVE_COACH_SESSIONS).map(async (session) => {
      const bundle = await fetchSessionCoachBundle(session.id);
      return {
        session,
        alerts: bundle.alerts,
        recommendations: bundle.recommendations,
      };
    }),
  );

  const deliverables = campaignsResult.data.items
    .filter((campaign) => campaign.applicationDeadline)
    .map((campaign) => ({
      id: campaign.id,
      title: `Campaign deliverables · ${campaign.title}`,
      campaignTitle: campaign.title,
      dueAt: campaign.applicationDeadline!,
      overdue: new Date(campaign.applicationDeadline!).getTime() < Date.now(),
    }));

  return {
    campaigns: campaignsResult.data.items,
    leads: leadsResult.data.items,
    liveSessions: agencySessions.items,
    coachAlerts,
    creatorNames,
    activityFeed,
    expiringDocuments: expiringDocuments?.success ? expiringDocuments.data : null,
    expiringContracts: expiringContracts?.success ? expiringContracts.data : null,
    deliverables,
    partial:
      campaignsResult.source === 'empty' ||
      leadsResult.source === 'empty' ||
      activityFeed.source === 'empty',
  };
}

export type OperationsCenterSources = Awaited<ReturnType<typeof loadOperationsCenterSources>>;
