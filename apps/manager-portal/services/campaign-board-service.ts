import {
  type CampaignListQuery,
  type ListCampaignsResponse,
  ListCampaignsResponseSchema,
} from '@kolab/types';

import { useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { CampaignOperationsApiError } from './campaign-operations-errors';

export type CampaignBoardDataSource = 'mock' | 'live' | 'empty';

function buildCampaignsQuery(query: CampaignListQuery = { limit: 50 }): string {
  const params = new URLSearchParams();
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.limit) params.set('limit', String(query.limit));
  if (query.status) params.set('status', query.status);
  if (query.campaignType) params.set('campaignType', query.campaignType);
  if (query.search) params.set('search', query.search);

  const serialized = params.toString();
  return serialized ? `/api/campaigns?${serialized}` : '/api/campaigns?limit=50';
}

export async function fetchCampaignBoardList(
  query: CampaignListQuery = { limit: 50 },
): Promise<{ data: ListCampaignsResponse; source: CampaignBoardDataSource }> {
  if (useMockStudioData()) {
    return { data: { items: [], nextCursor: null }, source: 'mock' };
  }

  try {
    const data = await apiClient.get<unknown>(buildCampaignsQuery(query));
    const parsed = ListCampaignsResponseSchema.parse(data);
    return {
      data: parsed,
      source: parsed.items.length === 0 ? 'empty' : 'live',
    };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new CampaignOperationsApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return { data: { items: [], nextCursor: null }, source: 'empty' };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load campaigns');
  }
}
