import { getDefaultOrganizationId, useMockStudioData } from '@/lib/env';
import { buildAdministrationWorkspace } from '@/types/administration-adapters';
import type {
  AdministrationDataSource,
  ManagerAdministrationWorkspace,
} from '@/types/administration-workspace';

import { AdministrationApiError } from './administration-errors';
import { loadAdministrationSources } from './administration-loader';
import { createMockAdministrationWorkspace } from './administration-mock';
import { isApiClientError } from './api-client';

export type AdministrationFetchResult = {
  data: ManagerAdministrationWorkspace;
  source: AdministrationDataSource;
};

export async function fetchAdministrationWorkspace(
  organizationId: string = getDefaultOrganizationId(),
): Promise<AdministrationFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockAdministrationWorkspace(organizationId),
      source: 'mock',
    };
  }

  try {
    const sources = await loadAdministrationSources(organizationId);

    const workspace = buildAdministrationWorkspace({
      organizationId,
      organization: sources.organization?.organization ?? null,
      agencyProfile: sources.agencyProfile?.profile ?? null,
      agencySettings: sources.agencySettings?.settings ?? null,
      members: sources.members,
      invitations: sources.invitations,
      auditLogs: sources.auditLogs,
      partial: sources.partial,
      apiReachable: sources.apiReachable,
    });

    const isEmpty =
      sources.members.length === 0 &&
      sources.invitations.length === 0 &&
      sources.auditLogs.length === 0 &&
      !sources.organization;

    const source: AdministrationDataSource = isEmpty
      ? 'empty'
      : sources.partial
        ? 'partial'
        : 'live';

    return { data: workspace, source };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new AdministrationApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return {
          data: createMockAdministrationWorkspace(organizationId),
          source: 'empty',
        };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load administration workspace');
  }
}
