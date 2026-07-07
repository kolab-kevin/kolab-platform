'use client';

import { useWorkspaceQuery } from '@/hooks/use-workspace-query';
import { fetchOperationsCenterWorkspace } from '@/services/operations-center-service';

export function useOperationsCenter() {
  return useWorkspaceQuery({
    queryKey: 'operations-center-workspace',
    fetcher: fetchOperationsCenterWorkspace,
    errorMessage: 'Unable to load operations center',
  });
}
