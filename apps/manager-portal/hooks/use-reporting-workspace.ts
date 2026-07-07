'use client';

import { useWorkspaceQuery } from '@/hooks/use-workspace-query';
import { fetchReportingWorkspace } from '@/services/reporting-service';

export function useReportingWorkspace() {
  return useWorkspaceQuery({
    queryKey: 'reporting-workspace',
    fetcher: fetchReportingWorkspace,
    errorMessage: 'Unable to load reporting workspace',
  });
}
