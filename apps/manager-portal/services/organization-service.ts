import {
  AgencyProfileResponseSchema,
  AgencySettingsResponseSchema,
  CurrentOrganizationResponseSchema,
} from '@kolab/types';

import { useMockStudioData } from '@/lib/env';

import { AdministrationApiError } from './administration-errors';
import { apiClient, isApiClientError } from './api-client';

export type OrganizationDataSource = 'mock' | 'live' | 'empty';

export async function fetchCurrentOrganization(): Promise<{
  data: ReturnType<typeof CurrentOrganizationResponseSchema.parse> | null;
  source: OrganizationDataSource;
}> {
  if (useMockStudioData()) {
    return { data: null, source: 'mock' };
  }

  try {
    const data = await apiClient.get<unknown>('/api/organizations/current');
    return {
      data: CurrentOrganizationResponseSchema.parse(data),
      source: 'live',
    };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new AdministrationApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return { data: null, source: 'empty' };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load organization');
  }
}

export async function fetchAgencyProfile(): Promise<{
  profile: ReturnType<typeof AgencyProfileResponseSchema.parse> | null;
  settings: ReturnType<typeof AgencySettingsResponseSchema.parse> | null;
  source: OrganizationDataSource;
}> {
  if (useMockStudioData()) {
    return { profile: null, settings: null, source: 'mock' };
  }

  try {
    const [profileData, settingsData] = await Promise.all([
      apiClient.get<unknown>('/api/agency'),
      apiClient.get<unknown>('/api/agency/settings'),
    ]);

    return {
      profile: AgencyProfileResponseSchema.parse(profileData),
      settings: AgencySettingsResponseSchema.parse(settingsData),
      source: 'live',
    };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new AdministrationApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return { profile: null, settings: null, source: 'empty' };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load agency profile');
  }
}
