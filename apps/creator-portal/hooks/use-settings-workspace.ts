'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { getApiBaseUrl, getCreatorProfileId, useMockStudioData } from '@/lib/env';
import { isDashboardUnauthorizedError } from '@/services/dashboard-errors';
import { fetchSettingsWorkspace, type SettingsDataSource } from '@/services/settings-service';
import { type SettingsWorkspaceData } from '@/types/profile-adapters';

type SettingsWorkspaceState = {
  data: SettingsWorkspaceData | null;
  loading: boolean;
  error: string | null;
  source: SettingsDataSource | null;
  refresh: () => Promise<void>;
};

function createFallbackSettingsData(): SettingsWorkspaceData {
  return {
    general: null,
    mockMode: useMockStudioData(),
    version: '0.0.0',
    environment: {
      apiBaseUrl: getApiBaseUrl(),
      creatorProfileId: getCreatorProfileId(),
      mockMode: useMockStudioData(),
      nodeEnv: process.env.NODE_ENV ?? 'development',
    },
  };
}

export function useSettingsWorkspace(): SettingsWorkspaceState {
  const router = useRouter();
  const [data, setData] = React.useState<SettingsWorkspaceData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<SettingsDataSource | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchSettingsWorkspace();
      setData(result.data);
      setSource(result.source);
    } catch (err) {
      if (isDashboardUnauthorizedError(err)) {
        router.replace('/unauthorized');
        return;
      }

      setError(err instanceof Error ? err.message : 'Failed to load settings');
      setData(createFallbackSettingsData());
      setSource(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, source, refresh };
}
