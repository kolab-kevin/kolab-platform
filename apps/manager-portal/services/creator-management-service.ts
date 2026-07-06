import { type CreatorListQuery, ListCreatorsResponseSchema } from '@kolab/types';

import { getDefaultOrganizationId, useMockStudioData } from '@/lib/env';
import { mapListCreatorsResponse } from '@/types/creator-adapters';
import type {
  CreatorManagementDataSource,
  ManagerCreatorDetail,
  ManagerCreatorManagementWorkspace,
} from '@/types/creator-management';

import { apiClient, isApiClientError } from './api-client';
import { CreatorManagementApiError } from './creator-management-errors';
import { loadCreatorManagementDetail } from './creator-management-loader';
import {
  createMockCreatorDetail,
  createMockCreatorManagementWorkspace,
} from './creator-management-mock';

export type CreatorManagementFetchResult = {
  data: ManagerCreatorManagementWorkspace;
  source: CreatorManagementDataSource;
};

export type CreatorDetailFetchResult = {
  data: ManagerCreatorDetail | null;
  source: CreatorManagementDataSource;
};

function buildCreatorsQuery(query: CreatorListQuery): string {
  const params = new URLSearchParams();
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.limit) params.set('limit', String(query.limit));
  if (query.search) params.set('search', query.search);
  if (query.platform) params.set('platform', query.platform);
  if (query.recruiterId) params.set('recruiterId', query.recruiterId);
  if (query.country) params.set('country', query.country);
  if (query.language) params.set('language', query.language);
  if (query.status) params.set('status', query.status);

  const serialized = params.toString();
  return serialized ? `/api/creators?${serialized}` : '/api/creators';
}

export async function fetchCreatorManagementWorkspace(
  organizationId: string = getDefaultOrganizationId(),
  query: CreatorListQuery = { limit: 50 },
): Promise<CreatorManagementFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockCreatorManagementWorkspace(organizationId),
      source: 'mock',
    };
  }

  try {
    const response = await apiClient.get<unknown>(buildCreatorsQuery(query));
    const parsed = ListCreatorsResponseSchema.parse(response);

    return {
      data: {
        organizationId,
        generatedAt: new Date().toISOString(),
        list: {
          items: mapListCreatorsResponse(parsed),
          nextCursor: parsed.nextCursor,
          totalCount: parsed.items.length,
        },
      },
      source: parsed.items.length === 0 ? 'empty' : 'live',
    };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new CreatorManagementApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return {
          data: {
            organizationId,
            generatedAt: new Date().toISOString(),
            list: { items: [], nextCursor: null, totalCount: 0 },
          },
          source: 'empty',
        };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load creators');
  }
}

export async function fetchCreatorManagementDetail(
  creatorId: string,
): Promise<CreatorDetailFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockCreatorDetail(creatorId),
      source: 'mock',
    };
  }

  const result = await loadCreatorManagementDetail(creatorId);

  return {
    data: result.detail,
    source: result.source,
  };
}
