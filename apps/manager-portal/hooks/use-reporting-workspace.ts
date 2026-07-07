'use client';

import * as React from 'react';

import { useOrganization } from '@/contexts/organization-context';
import { fetchReportingWorkspace } from '@/services/reporting-service';
import type { ManagerReportingWorkspace, ReportingDataSource } from '@/types/reporting-workspace';

export function useReportingWorkspace() {
  const { activeOrganization } = useOrganization();
  const [workspace, setWorkspace] = React.useState<ManagerReportingWorkspace | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<ReportingDataSource | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchReportingWorkspace(activeOrganization.id);
      setWorkspace(result.data);
      setSource(result.source);
    } catch (err) {
      setWorkspace(null);
      setSource(null);
      setError(err instanceof Error ? err.message : 'Unable to load reporting workspace');
    } finally {
      setLoading(false);
    }
  }, [activeOrganization.id]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    workspace,
    loading,
    error,
    source,
    refresh,
  };
}
