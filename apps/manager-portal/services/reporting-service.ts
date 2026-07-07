import { getDefaultOrganizationId, useMockStudioData } from '@/lib/env';
import {
  buildCampaignAnalytics,
  buildCreatorAnalytics,
  buildExportCenter,
  buildIntelligenceDashboard,
  buildLiveAnalytics,
  buildRecruitingAnalytics,
} from '@/types/reporting-adapters';
import type { ManagerReportingWorkspace, ReportingDataSource } from '@/types/reporting-workspace';

import { isApiClientError } from './api-client';
import { buildExecutiveDashboard } from './executive-dashboard-service';
import { ReportingApiError } from './reporting-errors';
import { loadReportingSources } from './reporting-loader';
import { createMockReportingWorkspace } from './reporting-mock';

export type ReportingFetchResult = {
  data: ManagerReportingWorkspace;
  source: ReportingDataSource;
};

export async function fetchReportingWorkspace(
  organizationId: string = getDefaultOrganizationId(),
): Promise<ReportingFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockReportingWorkspace(organizationId),
      source: 'mock',
    };
  }

  try {
    const sources = await loadReportingSources(organizationId);

    const workspace: ManagerReportingWorkspace = {
      organizationId,
      generatedAt: new Date().toISOString(),
      executiveOverview: buildExecutiveDashboard(sources),
      creatorAnalytics: buildCreatorAnalytics(sources.creators),
      campaignAnalytics: buildCampaignAnalytics(sources.campaigns),
      recruitingAnalytics: buildRecruitingAnalytics(sources.leads, sources.recruiters),
      liveAnalytics: buildLiveAnalytics(sources.liveSessions),
      intelligence: buildIntelligenceDashboard({
        creators: sources.creators,
        campaigns: sources.campaigns,
        leads: sources.leads,
        liveSessions: sources.liveSessions,
      }),
      exportCenter: buildExportCenter(),
    };

    const source: ReportingDataSource = sources.partial ? 'partial' : 'live';

    return { data: workspace, source };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new ReportingApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return {
          data: createMockReportingWorkspace(organizationId),
          source: 'empty',
        };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load reporting workspace');
  }
}
