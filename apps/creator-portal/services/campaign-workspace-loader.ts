import type {
  CampaignApplication,
  CampaignCreatorAssignment,
  CampaignDeliverable,
} from '@kolab/types';

import { getCreatorProfileId, useMockStudioData } from '@/lib/env';
import {
  buildCampaignWorkspaceData,
  type CampaignWorkspaceData,
  toDeliverableDisplayModel,
} from '@/types/campaign-adapters';

import { fetchCampaignAssignments } from './campaign-assignment-service';
import { fetchAssignmentDeliverables } from './campaign-deliverable-service';
import { createEmptyCampaignWorkspace, createMockCampaignWorkspace } from './campaign-mock';
import {
  fetchCampaignApplications,
  fetchCampaigns,
  fetchCampaignTemplateDeliverables,
} from './campaign-service';

export type CampaignWorkspaceDataSource = 'mock' | 'live' | 'empty' | 'partial';

export type CampaignWorkspaceFetchResult = {
  data: CampaignWorkspaceData;
  source: CampaignWorkspaceDataSource;
};

function resolveDeliverableTitle(
  deliverable: { campaignDeliverableId: string; metadata: Record<string, unknown> },
  templateDeliverables: CampaignDeliverable[],
): string {
  const metadataTitle = deliverable.metadata.title;
  if (typeof metadataTitle === 'string') return metadataTitle;

  const template = templateDeliverables.find(
    (item) => item.id === deliverable.campaignDeliverableId,
  );
  return template?.title ?? deliverable.campaignDeliverableId;
}

export async function fetchCampaignWorkspace(
  creatorProfileId: string = getCreatorProfileId(),
): Promise<CampaignWorkspaceFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockCampaignWorkspace(creatorProfileId),
      source: 'mock',
    };
  }

  const campaignsResult = await fetchCampaigns();
  if (campaignsResult.data.items.length === 0) {
    return {
      data: createEmptyCampaignWorkspace(),
      source: 'empty',
    };
  }

  const campaigns = campaignsResult.data.items;
  const assignments: CampaignCreatorAssignment[] = [];
  const applications: CampaignApplication[] = [];
  const creatorDeliverables: ReturnType<typeof toDeliverableDisplayModel>[] = [];
  const templateDeliverables: CampaignDeliverable[] = [];
  let hadPartialFailure = false;

  await Promise.all(
    campaigns.map(async (campaign) => {
      try {
        const [assignmentsResult, applicationsResult, templateResult] = await Promise.all([
          fetchCampaignAssignments(campaign.id, creatorProfileId),
          fetchCampaignApplications(campaign.id, creatorProfileId),
          fetchCampaignTemplateDeliverables(campaign.id),
        ]);

        assignments.push(...assignmentsResult.data.items);
        applications.push(...applicationsResult.data.items);
        templateDeliverables.push(...templateResult.data.items);

        await Promise.all(
          assignmentsResult.data.items.map(async (assignment) => {
            try {
              const deliverablesResult = await fetchAssignmentDeliverables(
                campaign.id,
                assignment.id,
              );

              for (const deliverable of deliverablesResult.data.items) {
                creatorDeliverables.push(
                  toDeliverableDisplayModel({
                    deliverable,
                    campaignId: campaign.id,
                    campaignTitle: campaign.title,
                    title: resolveDeliverableTitle(deliverable, templateResult.data.items),
                  }),
                );
              }
            } catch {
              hadPartialFailure = true;
            }
          }),
        );
      } catch {
        hadPartialFailure = true;
      }
    }),
  );

  const data = buildCampaignWorkspaceData({
    campaigns,
    assignments,
    applications,
    creatorDeliverables,
    templateDeliverables,
  });

  const isEmpty =
    data.assignedCampaigns.length === 0 &&
    Object.values(data.deliverables).every((items) => items.length === 0) &&
    Object.values(data.applications).every((items) => items.length === 0);

  return {
    data,
    source: isEmpty ? 'empty' : hadPartialFailure ? 'partial' : 'live',
  };
}
