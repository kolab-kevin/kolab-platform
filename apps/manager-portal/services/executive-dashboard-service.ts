import { buildExecutiveOverview } from '@/types/reporting-adapters';
import type { ManagerExecutiveOverview } from '@/types/reporting-workspace';

import type { ReportingLoaderResult } from './reporting-loader';

export function buildExecutiveDashboard(sources: ReportingLoaderResult): ManagerExecutiveOverview {
  return buildExecutiveOverview({
    creators: sources.creators,
    campaigns: sources.campaigns,
    leads: sources.leads,
    liveSessions: sources.liveSessions,
  });
}
