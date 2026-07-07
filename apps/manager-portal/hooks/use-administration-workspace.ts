'use client';

import * as React from 'react';

import { useOrganization } from '@/contexts/organization-context';
import { fetchAdministrationWorkspace } from '@/services/administration-service';
import type {
  AdministrationDataSource,
  ManagerAdministrationWorkspace,
} from '@/types/administration-workspace';

export function useAdministrationWorkspace() {
  const { activeOrganization } = useOrganization();
  const [workspace, setWorkspace] = React.useState<ManagerAdministrationWorkspace | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<AdministrationDataSource | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAdministrationWorkspace(activeOrganization.id);
      setWorkspace(result.data);
      setSource(result.source);
    } catch (err) {
      setWorkspace(null);
      setSource(null);
      setError(err instanceof Error ? err.message : 'Unable to load administration workspace');
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
