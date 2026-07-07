'use client';

import { useWorkspaceQuery } from '@/hooks/use-workspace-query';
import { fetchAdministrationWorkspace } from '@/services/administration-service';

export function useAdministrationWorkspace() {
  return useWorkspaceQuery({
    queryKey: 'administration-workspace',
    fetcher: fetchAdministrationWorkspace,
    errorMessage: 'Unable to load administration workspace',
  });
}
