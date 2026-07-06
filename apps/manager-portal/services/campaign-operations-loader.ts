import { ListCreatorsResponseSchema } from '@kolab/types';

import type {
  CampaignOperationsDataSource,
  ManagerCampaignDetail,
} from '@/types/campaign-operations';
import {
  buildCreatorNameMap,
  groupApplications,
  groupDeliverables,
  mapApplication,
  mapCampaignDetail,
  mapCreatorDeliverable,
} from '@/types/campaign-operations-adapters';

import { apiClient } from './api-client';
import { fetchCampaignApplications } from './campaign-applications-service';
import {
  fetchCampaignAssignments,
  fetchCampaignCreatorDeliverables,
  fetchCampaignTemplateDeliverables,
} from './campaign-deliverables-service';
import { fetchCampaignDetail } from './campaign-detail-service';

export async function loadCampaignOperationsDetail(campaignId: string): Promise<{
  detail: ManagerCampaignDetail | null;
  deliverables: ReturnType<typeof groupDeliverables>;
  applications: ReturnType<typeof groupApplications>;
  source: CampaignOperationsDataSource;
}> {
  const [campaignResult, templateResult, assignmentsResult, applicationsResult, creatorsResponse] =
    await Promise.all([
      fetchCampaignDetail(campaignId),
      fetchCampaignTemplateDeliverables(campaignId),
      fetchCampaignAssignments(campaignId),
      fetchCampaignApplications(campaignId),
      apiClient.get<unknown>('/api/creators?limit=100').catch(() => ({ items: [] })),
    ]);

  const campaign = campaignResult.data;
  if (!campaign) {
    return {
      detail: null,
      deliverables: groupDeliverables([]),
      applications: groupApplications([]),
      source: 'empty',
    };
  }

  const creators = ListCreatorsResponseSchema.safeParse(creatorsResponse);
  const creatorNames = creators.success ? buildCreatorNameMap(creators.data) : new Map();

  const creatorDeliverables = await fetchCampaignCreatorDeliverables(
    campaignId,
    assignmentsResult.items,
  );

  const templateById = new Map(templateResult.items.map((item) => [item.id, item.title]));

  const deliverableItems = creatorDeliverables.map((deliverable) =>
    mapCreatorDeliverable(
      deliverable,
      campaign,
      templateById.get(deliverable.campaignDeliverableId) ?? 'Deliverable',
      creatorNames.get(
        assignmentsResult.items.find((item) => item.id === deliverable.assignmentId)
          ?.creatorProfileId ?? '',
      ) ?? null,
    ),
  );

  const applicationItems = applicationsResult.data.items
    .map((application) =>
      mapApplication(
        application,
        campaign,
        creatorNames.get(application.creatorProfileId) ?? application.creatorProfileId,
      ),
    )
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const partial =
    !templateResult.items.length ||
    !assignmentsResult.items.length ||
    !applicationsResult.data.items.length;

  return {
    detail: mapCampaignDetail({
      campaign,
      templateDeliverables: templateResult.items,
      assignments: assignmentsResult.items,
      creatorNames,
    }),
    deliverables: groupDeliverables(deliverableItems),
    applications: groupApplications(applicationItems),
    source: partial ? 'partial' : campaignResult.source === 'live' ? 'live' : 'empty',
  };
}
