import {
  type ListCampaignCreatorDeliverablesResponse,
  ListCampaignCreatorDeliverablesResponseSchema,
} from '@kolab/types';

import { useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { createMockCreatorDeliverables } from './campaign-mock';
import { DashboardApiError } from './dashboard-errors';

export type CampaignDeliverableDataSource = 'mock' | 'live' | 'empty';

export type CampaignCreatorDeliverablesFetchResult = {
  data: ListCampaignCreatorDeliverablesResponse;
  source: CampaignDeliverableDataSource;
};

export function getAssignmentDeliverablesPath(campaignId: string, assignmentId: string): string {
  return `/api/campaigns/${campaignId}/assignments/${assignmentId}/deliverables`;
}

export async function fetchAssignmentDeliverables(
  campaignId: string,
  assignmentId: string,
): Promise<CampaignCreatorDeliverablesFetchResult> {
  if (useMockStudioData()) {
    return {
      data: {
        items: createMockCreatorDeliverables().filter((item) => item.assignmentId === assignmentId),
      },
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(
      getAssignmentDeliverablesPath(campaignId, assignmentId),
    );
    return {
      data: ListCampaignCreatorDeliverablesResponseSchema.parse(data),
      source: 'live',
    };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new DashboardApiError(error.message, error.status);
      }

      if (error.status === 404) {
        return { data: { items: [] }, source: 'empty' };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load assignment deliverables');
  }
}
