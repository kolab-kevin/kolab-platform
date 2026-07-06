import { ListCreatorsResponseSchema } from '@kolab/types';

import { getDefaultOrganizationId, useMockStudioData } from '@/lib/env';
import type {
  CampaignOperationsDataSource,
  ManagerCampaignOperationsWorkspace,
} from '@/types/campaign-operations';
import {
  buildCampaignBoard,
  buildCampaignOverview,
  buildCreatorNameMap,
  countPendingApplications,
  groupApplications,
  groupDeliverables,
  mapApplication,
  mapCampaignDetail,
  mapCampaignListItem,
  mapCreatorDeliverable,
} from '@/types/campaign-operations-adapters';

import { apiClient, isApiClientError } from './api-client';
import { fetchAllCampaignApplications } from './campaign-applications-service';
import { fetchCampaignBoardList } from './campaign-board-service';
import {
  fetchAllCampaignAssignments,
  fetchCampaignCreatorDeliverables,
  fetchCampaignTemplateDeliverables,
} from './campaign-deliverables-service';
import { CampaignOperationsApiError } from './campaign-operations-errors';
import { loadCampaignOperationsDetail } from './campaign-operations-loader';
import {
  createMockCampaignOperationsWorkspace,
  MOCK_CAMPAIGN_PRIMARY,
} from './campaign-operations-mock';

export type CampaignOperationsFetchResult = {
  data: ManagerCampaignOperationsWorkspace;
  source: CampaignOperationsDataSource;
};

const MAX_DETAIL_CAMPAIGNS = 10;

export async function fetchCampaignOperationsWorkspace(
  organizationId: string = getDefaultOrganizationId(),
): Promise<CampaignOperationsFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockCampaignOperationsWorkspace(organizationId),
      source: 'mock',
    };
  }

  try {
    const [campaignList, creatorsResponse] = await Promise.all([
      fetchCampaignBoardList({ limit: 50 }),
      apiClient.get<unknown>('/api/creators?limit=100'),
    ]);

    const campaigns = campaignList.data.items;
    const campaignIds = campaigns.map((campaign) => campaign.id);
    const creators = ListCreatorsResponseSchema.parse(creatorsResponse);
    const creatorNames = buildCreatorNameMap(creators);

    const [allApplications, allAssignments] = await Promise.all([
      fetchAllCampaignApplications(campaignIds.slice(0, MAX_DETAIL_CAMPAIGNS)),
      fetchAllCampaignAssignments(campaignIds.slice(0, MAX_DETAIL_CAMPAIGNS)),
    ]);

    const applicationsByCampaign = new Map<string, typeof allApplications>();
    const assignmentsByCampaign = new Map<string, typeof allAssignments>();

    for (const application of allApplications) {
      const current = applicationsByCampaign.get(application.campaignId) ?? [];
      current.push(application);
      applicationsByCampaign.set(application.campaignId, current);
    }

    for (const assignment of allAssignments) {
      const current = assignmentsByCampaign.get(assignment.campaignId) ?? [];
      current.push(assignment);
      assignmentsByCampaign.set(assignment.campaignId, current);
    }

    const deliverableBundles = await Promise.all(
      campaigns.slice(0, MAX_DETAIL_CAMPAIGNS).map(async (campaign) => {
        const assignments = assignmentsByCampaign.get(campaign.id) ?? [];
        const templateResult = await fetchCampaignTemplateDeliverables(campaign.id);
        const creatorDeliverables = await fetchCampaignCreatorDeliverables(
          campaign.id,
          assignments,
        );
        const templateById = new Map(templateResult.items.map((item) => [item.id, item.title]));

        return creatorDeliverables.map((deliverable) =>
          mapCreatorDeliverable(
            deliverable,
            campaign,
            templateById.get(deliverable.campaignDeliverableId) ?? 'Deliverable',
            creatorNames.get(
              assignments.find((item) => item.id === deliverable.assignmentId)?.creatorProfileId ??
                '',
            ) ?? null,
          ),
        );
      }),
    );

    const deliverableItems = deliverableBundles.flat();
    const overdueByCampaign = new Map<string, number>();

    for (const item of deliverableItems) {
      if (item.bucket === 'overdue') {
        overdueByCampaign.set(item.campaignId, (overdueByCampaign.get(item.campaignId) ?? 0) + 1);
      }
    }

    const listItems = campaigns.map((campaign) => {
      const apps = applicationsByCampaign.get(campaign.id) ?? [];
      const assignments = assignmentsByCampaign.get(campaign.id) ?? [];
      return mapCampaignListItem(
        campaign,
        assignments.length,
        countPendingApplications(apps),
        overdueByCampaign.get(campaign.id) ?? 0,
      );
    });

    const applicationItems = allApplications
      .map((application) => {
        const campaign = campaigns.find((item) => item.id === application.campaignId);
        if (!campaign) return null;
        return mapApplication(
          application,
          campaign,
          creatorNames.get(application.creatorProfileId) ?? application.creatorProfileId,
        );
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const selectedCampaignId =
      listItems.find((item) => item.status === 'ACTIVE')?.id ?? listItems[0]?.id ?? null;

    let detail = null;
    let detailDeliverables = groupDeliverables(deliverableItems);
    let detailApplications = groupApplications(applicationItems);
    let detailSource: CampaignOperationsDataSource = campaignList.source;

    if (selectedCampaignId) {
      const loaded = await loadCampaignOperationsDetail(selectedCampaignId);
      detail = loaded.detail;
      detailDeliverables = loaded.deliverables;
      detailApplications = loaded.applications;
      detailSource = loaded.source;
    } else if (selectedCampaignId === null && campaigns[0]) {
      detail = mapCampaignDetail({
        campaign: campaigns[0],
        templateDeliverables: [],
        assignments: [],
        creatorNames,
      });
    }

    const workspace: ManagerCampaignOperationsWorkspace = {
      organizationId,
      generatedAt: new Date().toISOString(),
      overview: buildCampaignOverview(listItems, allAssignments.length),
      campaigns: listItems,
      board: buildCampaignBoard(listItems),
      detail,
      deliverables: detailDeliverables,
      applications: detailApplications,
      selectedCampaignId,
    };

    const source: CampaignOperationsDataSource =
      campaigns.length === 0
        ? 'empty'
        : detailSource === 'partial' || campaignList.source === 'empty'
          ? 'partial'
          : 'live';

    return { data: workspace, source };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new CampaignOperationsApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return {
          data: createMockCampaignOperationsWorkspace(organizationId),
          source: 'empty',
        };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load campaign operations');
  }
}

export async function fetchCampaignOperationsDetail(campaignId: string) {
  if (useMockStudioData()) {
    const workspace = createMockCampaignOperationsWorkspace(getDefaultOrganizationId());
    return {
      data: {
        detail: workspace.detail,
        deliverables: workspace.deliverables,
        applications: workspace.applications,
      },
      source: 'mock' as const,
    };
  }

  const loaded = await loadCampaignOperationsDetail(campaignId);
  return {
    data: {
      detail: loaded.detail,
      deliverables: loaded.deliverables,
      applications: loaded.applications,
    },
    source: loaded.source,
  };
}

export { MOCK_CAMPAIGN_PRIMARY };
