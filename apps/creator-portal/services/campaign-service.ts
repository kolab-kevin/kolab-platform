import {
  type Campaign,
  CampaignSchema,
  type ListCampaignApplicationsResponse,
  ListCampaignApplicationsResponseSchema,
  type ListCampaignDeliverablesResponse,
  ListCampaignDeliverablesResponseSchema,
  type ListCampaignsResponse,
  ListCampaignsResponseSchema,
} from '@kolab/types';

import { getCreatorProfileId, useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import {
  createMockCampaignApplications,
  createMockCampaigns,
  createMockTemplateDeliverables,
} from './campaign-mock';
import { DashboardApiError } from './dashboard-errors';

export type CampaignDataSource = 'mock' | 'live' | 'empty';

export type CampaignFetchResult = {
  data: Campaign;
  source: CampaignDataSource;
};

export type CampaignsListFetchResult = {
  data: ListCampaignsResponse;
  source: CampaignDataSource;
};

export type CampaignApplicationsFetchResult = {
  data: ListCampaignApplicationsResponse;
  source: CampaignDataSource;
};

export type CampaignTemplateDeliverablesFetchResult = {
  data: ListCampaignDeliverablesResponse;
  source: CampaignDataSource;
};

export function getCampaignsPath(): string {
  return '/api/campaigns';
}

export function getCampaignPath(campaignId: string): string {
  return `/api/campaigns/${campaignId}`;
}

export function getCampaignApplicationsPath(campaignId: string, creatorProfileId: string): string {
  const params = new URLSearchParams({ creatorProfileId });
  return `/api/campaigns/${campaignId}/applications?${params.toString()}`;
}

export function getCampaignTemplateDeliverablesPath(campaignId: string): string {
  return `/api/campaigns/${campaignId}/deliverables`;
}

export async function fetchCampaigns(): Promise<CampaignsListFetchResult> {
  if (useMockStudioData()) {
    return {
      data: {
        items: createMockCampaigns(getCreatorProfileId()),
        nextCursor: null,
      },
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(getCampaignsPath());
    return {
      data: ListCampaignsResponseSchema.parse(data),
      source: 'live',
    };
  } catch (error) {
    return handleCampaignListError(error);
  }
}

export async function fetchCampaign(campaignId: string): Promise<CampaignFetchResult> {
  if (useMockStudioData()) {
    const campaign = createMockCampaigns(getCreatorProfileId()).find(
      (item) => item.id === campaignId,
    );
    if (!campaign) {
      return {
        data: createMockCampaigns(getCreatorProfileId())[0]!,
        source: 'mock',
      };
    }

    return { data: campaign, source: 'mock' };
  }

  try {
    const data = await apiClient.get<unknown>(getCampaignPath(campaignId));
    return {
      data: CampaignSchema.parse(data),
      source: 'live',
    };
  } catch (error) {
    return handleCampaignError(error, campaignId);
  }
}

export async function fetchCampaignApplications(
  campaignId: string,
  creatorProfileId: string = getCreatorProfileId(),
): Promise<CampaignApplicationsFetchResult> {
  if (useMockStudioData()) {
    return {
      data: {
        items: createMockCampaignApplications(creatorProfileId).filter(
          (application) => application.campaignId === campaignId,
        ),
      },
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(
      getCampaignApplicationsPath(campaignId, creatorProfileId),
    );
    return {
      data: ListCampaignApplicationsResponseSchema.parse(data),
      source: 'live',
    };
  } catch (error) {
    return handleCampaignApplicationsError(error);
  }
}

export async function fetchCampaignTemplateDeliverables(
  campaignId: string,
): Promise<CampaignTemplateDeliverablesFetchResult> {
  if (useMockStudioData()) {
    return {
      data: {
        items: createMockTemplateDeliverables().filter((item) => item.campaignId === campaignId),
      },
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(getCampaignTemplateDeliverablesPath(campaignId));
    return {
      data: ListCampaignDeliverablesResponseSchema.parse(data),
      source: 'live',
    };
  } catch (error) {
    return handleCampaignTemplateDeliverablesError(error);
  }
}

function handleCampaignListError(error: unknown): CampaignsListFetchResult {
  if (isApiClientError(error)) {
    if (error.status === 401 || error.status === 403) {
      throw new DashboardApiError(error.message, error.status);
    }

    if (error.status === 404) {
      return { data: { items: [], nextCursor: null }, source: 'empty' };
    }
  }

  throw error instanceof Error ? error : new Error('Failed to load campaigns');
}

function handleCampaignError(error: unknown, campaignId: string): CampaignFetchResult {
  if (isApiClientError(error)) {
    if (error.status === 401 || error.status === 403) {
      throw new DashboardApiError(error.message, error.status);
    }

    if (error.status === 404) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }
  }

  throw error instanceof Error ? error : new Error('Failed to load campaign');
}

function handleCampaignApplicationsError(error: unknown): CampaignApplicationsFetchResult {
  if (isApiClientError(error)) {
    if (error.status === 401 || error.status === 403) {
      throw new DashboardApiError(error.message, error.status);
    }

    if (error.status === 404) {
      return { data: { items: [] }, source: 'empty' };
    }
  }

  throw error instanceof Error ? error : new Error('Failed to load campaign applications');
}

function handleCampaignTemplateDeliverablesError(
  error: unknown,
): CampaignTemplateDeliverablesFetchResult {
  if (isApiClientError(error)) {
    if (error.status === 401 || error.status === 403) {
      throw new DashboardApiError(error.message, error.status);
    }

    if (error.status === 404) {
      return { data: { items: [] }, source: 'empty' };
    }
  }

  throw error instanceof Error ? error : new Error('Failed to load campaign deliverables');
}
