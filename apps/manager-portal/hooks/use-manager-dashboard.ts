'use client';

import * as React from 'react';

import { fetchManagerDashboard } from '@/services/dashboard-service';
import type { ManagerDashboardResponse } from '@/types/manager-dashboard';

export function useManagerDashboard(organizationId?: string) {
  const [data, setData] = React.useState<ManagerDashboardResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<'mock' | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchManagerDashboard(organizationId);
      setData(result.data);
      setSource(result.source);
    } catch (err) {
      setData(null);
      setSource(null);
      setError(err instanceof Error ? err.message : 'Unable to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, source, refresh };
}
