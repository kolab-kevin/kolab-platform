import { type Campaign, CampaignSchema } from '@kolab/types';

import { useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { CampaignOperationsApiError } from './campaign-operations-errors';
import { getMockCampaignById } from './campaign-operations-mock';

export type CampaignDetailDataSource = 'mock' | 'live' | 'empty';

export async function fetchCampaignDetail(
  campaignId: string,
): Promise<{ data: Campaign | null; source: CampaignDetailDataSource }> {
  if (useMockStudioData()) {
    return { data: getMockCampaignById(campaignId), source: 'mock' };
  }

  try {
    const data = await apiClient.get<unknown>(`/api/campaigns/${campaignId}`);
    const parsed = CampaignSchema.safeParse(data);
    if (!parsed.success) {
      return { data: null, source: 'empty' };
    }
    return { data: parsed.data, source: 'live' };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new CampaignOperationsApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return { data: null, source: 'empty' };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load campaign detail');
  }
}
