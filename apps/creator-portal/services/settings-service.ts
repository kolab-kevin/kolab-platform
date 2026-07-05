import { type ProfileResponse, ProfileResponseSchema } from '@kolab/types';

import { getApiBaseUrl, getCreatorProfileId, useMockStudioData } from '@/lib/env';
import {
  buildSettingsWorkspaceData,
  createEmptySettingsWorkspaceData,
  type SettingsWorkspaceData,
} from '@/types/profile-adapters';

import { apiClient, isApiClientError } from './api-client';
import { DashboardApiError } from './dashboard-errors';
import { createMockUserProfile } from './profile-mock';

export type SettingsDataSource = 'mock' | 'live' | 'empty' | 'partial';

export type SettingsFetchResult = {
  data: SettingsWorkspaceData;
  source: SettingsDataSource;
};

const APP_VERSION = '0.0.0';

function buildEnvironmentInfo() {
  return {
    apiBaseUrl: getApiBaseUrl(),
    creatorProfileId: getCreatorProfileId(),
    mockMode: useMockStudioData(),
    nodeEnv: process.env.NODE_ENV ?? 'development',
  };
}

export async function fetchUserProfile(): Promise<ProfileResponse | null> {
  if (useMockStudioData()) {
    return createMockUserProfile();
  }

  try {
    const data = await apiClient.get<unknown>('/api/profile');
    return ProfileResponseSchema.parse(data);
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new DashboardApiError(error.message, error.status);
      }

      if (error.status === 404) {
        return null;
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load user profile');
  }
}

export async function fetchSettingsWorkspace(): Promise<SettingsFetchResult> {
  const environment = buildEnvironmentInfo();
  const mockMode = useMockStudioData();

  if (mockMode) {
    return {
      data: buildSettingsWorkspaceData({
        profile: createMockUserProfile(),
        mockMode,
        version: APP_VERSION,
        environment,
      }),
      source: 'mock',
    };
  }

  try {
    const profile = await fetchUserProfile();

    return {
      data: buildSettingsWorkspaceData({
        profile,
        mockMode,
        version: APP_VERSION,
        environment,
      }),
      source: profile ? 'live' : 'empty',
    };
  } catch (error) {
    if (error instanceof DashboardApiError) {
      throw error;
    }

    return {
      data: createEmptySettingsWorkspaceData(environment, APP_VERSION, mockMode),
      source: 'partial',
    };
  }
}
