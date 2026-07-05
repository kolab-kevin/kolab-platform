import {
  type CreatorComplianceResponse,
  CreatorComplianceResponseSchema,
  type CreatorDetailResponse,
  CreatorDetailResponseSchema,
  type CreatorSkills,
  CreatorSkillsSchema,
  type CreatorStructuredAvailability,
  CreatorStructuredAvailabilitySchema,
  type ListCreatorPlatformAccountsResponse,
  ListCreatorPlatformAccountsResponseSchema,
} from '@kolab/types';

import { getCreatorProfileId, useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { DashboardApiError } from './dashboard-errors';
import {
  createMockCreatorAvailability,
  createMockCreatorCompliance,
  createMockCreatorDetail,
  createMockCreatorSkills,
  createMockPlatformAccounts,
} from './profile-mock';

export type ProfileDataSource = 'mock' | 'live' | 'empty';

export type ProfileFetchResult<T> = {
  data: T | null;
  source: ProfileDataSource;
};

function getCreatorPath(creatorProfileId: string): string {
  return `/api/creators/${creatorProfileId}`;
}

export async function fetchCreatorDetail(
  creatorProfileId: string = getCreatorProfileId(),
): Promise<ProfileFetchResult<CreatorDetailResponse>> {
  if (useMockStudioData()) {
    return {
      data: createMockCreatorDetail(creatorProfileId),
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(getCreatorPath(creatorProfileId));
    return {
      data: CreatorDetailResponseSchema.parse(data),
      source: 'live',
    };
  } catch (error) {
    return handleProfileFetchError(error);
  }
}

export async function fetchCreatorPlatformAccounts(
  creatorProfileId: string = getCreatorProfileId(),
): Promise<ProfileFetchResult<ListCreatorPlatformAccountsResponse>> {
  if (useMockStudioData()) {
    return {
      data: createMockPlatformAccounts(creatorProfileId),
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(
      `${getCreatorPath(creatorProfileId)}/platform-accounts`,
    );
    return {
      data: ListCreatorPlatformAccountsResponseSchema.parse(data),
      source: 'live',
    };
  } catch (error) {
    return handleProfileFetchError(error);
  }
}

export async function fetchCreatorSkills(
  creatorProfileId: string = getCreatorProfileId(),
): Promise<ProfileFetchResult<CreatorSkills>> {
  if (useMockStudioData()) {
    return {
      data: createMockCreatorSkills(),
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(`${getCreatorPath(creatorProfileId)}/skills`);
    return {
      data: CreatorSkillsSchema.parse(data),
      source: 'live',
    };
  } catch (error) {
    return handleProfileFetchError(error);
  }
}

export async function fetchCreatorAvailability(
  creatorProfileId: string = getCreatorProfileId(),
): Promise<ProfileFetchResult<CreatorStructuredAvailability>> {
  if (useMockStudioData()) {
    return {
      data: createMockCreatorAvailability(),
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(`${getCreatorPath(creatorProfileId)}/availability`);
    return {
      data: CreatorStructuredAvailabilitySchema.parse(data),
      source: 'live',
    };
  } catch (error) {
    return handleProfileFetchError(error);
  }
}

export async function fetchCreatorCompliance(
  creatorProfileId: string = getCreatorProfileId(),
): Promise<ProfileFetchResult<CreatorComplianceResponse>> {
  if (useMockStudioData()) {
    return {
      data: createMockCreatorCompliance(creatorProfileId),
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(`${getCreatorPath(creatorProfileId)}/compliance`);
    return {
      data: CreatorComplianceResponseSchema.parse(data),
      source: 'live',
    };
  } catch (error) {
    return handleProfileFetchError(error);
  }
}

function handleProfileFetchError<T>(error: unknown): ProfileFetchResult<T> {
  if (isApiClientError(error)) {
    if (error.status === 401 || error.status === 403) {
      throw new DashboardApiError(error.message, error.status);
    }

    if (error.status === 404) {
      return { data: null, source: 'empty' };
    }
  }

  throw error instanceof Error ? error : new Error('Failed to load profile data');
}
