'use client';

import type { CreatorDashboardResponse } from '@kolab/types';
import * as React from 'react';

import { useOrganization } from '@/contexts/organization-context';
import { fetchCreatorDashboard } from '@/services/dashboard-service';

type DashboardState = {
  data: CreatorDashboardResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useDashboard(): DashboardState {
  const { creatorProfile } = useOrganization();
  const [data, setData] = React.useState<CreatorDashboardResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboard = await fetchCreatorDashboard(creatorProfile.id);
      setData(dashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [creatorProfile.id]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
