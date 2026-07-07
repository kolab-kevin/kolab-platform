'use client';

import * as React from 'react';

import { useOrganization } from '@/contexts/organization-context';
import { fetchOperationsCenterWorkspace } from '@/services/operations-center-service';
import type {
  ManagerOperationsCenterWorkspace,
  OperationsCenterDataSource,
} from '@/types/operations-center';

export function useOperationsCenter() {
  const { activeOrganization } = useOrganization();
  const [workspace, setWorkspace] = React.useState<ManagerOperationsCenterWorkspace | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<OperationsCenterDataSource | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchOperationsCenterWorkspace(activeOrganization.id);
      setWorkspace(result.data);
      setSource(result.source);
    } catch (err) {
      setWorkspace(null);
      setSource(null);
      setError(err instanceof Error ? err.message : 'Unable to load operations center');
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
