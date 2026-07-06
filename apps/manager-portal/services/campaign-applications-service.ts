import {
  type ListCampaignApplicationsResponse,
  ListCampaignApplicationsResponseSchema,
} from '@kolab/types';

import { useMockStudioData } from '@/lib/env';

import { apiClient } from './api-client';
import { getMockApplicationsForCampaign } from './campaign-operations-mock';

export type CampaignApplicationsDataSource = 'mock' | 'live' | 'empty';

async function fetchOptionalApplications(
  campaignId: string,
): Promise<ListCampaignApplicationsResponse | null> {
  try {
    const data = await apiClient.get<unknown>(`/api/campaigns/${campaignId}/applications`);
    return ListCampaignApplicationsResponseSchema.parse(data);
  } catch {
    return null;
  }
}

export async function fetchCampaignApplications(campaignId: string) {
  if (useMockStudioData()) {
    return {
      data: { items: getMockApplicationsForCampaign(campaignId) },
      source: 'mock' as const,
    };
  }

  const data = await fetchOptionalApplications(campaignId);
  return {
    data: data ?? { items: [] },
    source: data ? ('live' as const) : ('empty' as const),
  };
}

export async function fetchAllCampaignApplications(campaignIds: string[]) {
  if (useMockStudioData()) {
    return campaignIds.flatMap((campaignId) => getMockApplicationsForCampaign(campaignId));
  }

  const results = await Promise.all(
    campaignIds.map((campaignId) => fetchOptionalApplications(campaignId)),
  );
  return results.flatMap((result) => result?.items ?? []);
}
