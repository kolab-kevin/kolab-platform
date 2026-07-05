import {
  type CampaignCreatorAssignment,
  CampaignCreatorAssignmentSchema,
  type ListCampaignCreatorAssignmentsResponse,
  ListCampaignCreatorAssignmentsResponseSchema,
} from '@kolab/types';

import { getCreatorProfileId, useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { createMockCampaignAssignments } from './campaign-mock';
import { DashboardApiError } from './dashboard-errors';

export type CampaignAssignmentDataSource = 'mock' | 'live' | 'empty';

export type CampaignAssignmentsFetchResult = {
  data: ListCampaignCreatorAssignmentsResponse;
  source: CampaignAssignmentDataSource;
};

export type CampaignAssignmentFetchResult = {
  data: CampaignCreatorAssignment;
  source: CampaignAssignmentDataSource;
};

export function getCampaignAssignmentsPath(campaignId: string, creatorProfileId: string): string {
  const params = new URLSearchParams({ creatorProfileId });
  return `/api/campaigns/${campaignId}/assignments?${params.toString()}`;
}

export function getCampaignAssignmentPath(campaignId: string, assignmentId: string): string {
  return `/api/campaigns/${campaignId}/assignments/${assignmentId}`;
}

export async function fetchCampaignAssignments(
  campaignId: string,
  creatorProfileId: string = getCreatorProfileId(),
): Promise<CampaignAssignmentsFetchResult> {
  if (useMockStudioData()) {
    return {
      data: {
        items: createMockCampaignAssignments(creatorProfileId).filter(
          (assignment) => assignment.campaignId === campaignId,
        ),
      },
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(
      getCampaignAssignmentsPath(campaignId, creatorProfileId),
    );
    return {
      data: ListCampaignCreatorAssignmentsResponseSchema.parse(data),
      source: 'live',
    };
  } catch (error) {
    return handleCampaignAssignmentsError(error);
  }
}

export async function fetchCampaignAssignment(
  campaignId: string,
  assignmentId: string,
): Promise<CampaignAssignmentFetchResult> {
  if (useMockStudioData()) {
    const assignment = createMockCampaignAssignments(getCreatorProfileId()).find(
      (item) => item.id === assignmentId && item.campaignId === campaignId,
    );

    if (!assignment) {
      throw new Error(`Assignment not found: ${assignmentId}`);
    }

    return { data: assignment, source: 'mock' };
  }

  try {
    const data = await apiClient.get<unknown>(getCampaignAssignmentPath(campaignId, assignmentId));
    return {
      data: CampaignCreatorAssignmentSchema.parse(data),
      source: 'live',
    };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new DashboardApiError(error.message, error.status);
      }

      if (error.status === 404) {
        throw new Error(`Assignment not found: ${assignmentId}`);
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load campaign assignment');
  }
}

function handleCampaignAssignmentsError(error: unknown): CampaignAssignmentsFetchResult {
  if (isApiClientError(error)) {
    if (error.status === 401 || error.status === 403) {
      throw new DashboardApiError(error.message, error.status);
    }

    if (error.status === 404) {
      return { data: { items: [] }, source: 'empty' };
    }
  }

  throw error instanceof Error ? error : new Error('Failed to load campaign assignments');
}
