'use client';

import dynamic from 'next/dynamic';

import { GlobalLoading } from '@/components/common/global-loading';
import { WorkspaceDataPage } from '@/components/common/workspace-data-page';
import { WorkspaceSection } from '@/components/common/workspace-layout';
import { ExecutiveOverviewPanel } from '@/components/reporting/executive-overview-panel';
import { ExportCenterPanel } from '@/components/reporting/export-center-panel';
import { useReportingWorkspace } from '@/hooks/use-reporting-workspace';
import { PORTAL_GRID_CLASS } from '@/lib/portal-ui';

const CreatorAnalyticsPanel = dynamic(
  () =>
    import('@/components/reporting/creator-analytics-panel').then(
      (module) => module.CreatorAnalyticsPanel,
    ),
  { loading: () => <GlobalLoading label="Loading creator analytics…" /> },
);

const CampaignAnalyticsPanel = dynamic(
  () =>
    import('@/components/reporting/campaign-analytics-panel').then(
      (module) => module.CampaignAnalyticsPanel,
    ),
  { loading: () => <GlobalLoading label="Loading campaign analytics…" /> },
);

const RecruitingAnalyticsPanel = dynamic(
  () =>
    import('@/components/reporting/recruiting-analytics-panel').then(
      (module) => module.RecruitingAnalyticsPanel,
    ),
  { loading: () => <GlobalLoading label="Loading recruiting analytics…" /> },
);

const LiveAnalyticsPanel = dynamic(
  () =>
    import('@/components/reporting/live-analytics-panel').then(
      (module) => module.LiveAnalyticsPanel,
    ),
  { loading: () => <GlobalLoading label="Loading live analytics…" /> },
);

const IntelligenceDashboardPanel = dynamic(
  () =>
    import('@/components/reporting/intelligence-dashboard-panel').then(
      (module) => module.IntelligenceDashboardPanel,
    ),
  { loading: () => <GlobalLoading label="Loading intelligence dashboard…" /> },
);

export function ReportingWorkspace() {
  const { workspace, loading, error, source, refresh } = useReportingWorkspace();

  return (
    <WorkspaceDataPage
      title="Reports"
      fallbackDescription="Agency analytics and exports"
      loadedDescription={
        workspace
          ? `Health score ${workspace.executiveOverview.organizationHealthScore}`
          : undefined
      }
      loading={loading}
      loadingLabel="Loading reporting workspace…"
      error={error}
      errorTitle="Unable to load reporting workspace"
      source={source}
      emptyMessage="No reporting data is available in this organization yet."
      onRefresh={refresh}
    >
      {workspace ? (
        <div className="space-y-6">
          <ExecutiveOverviewPanel overview={workspace.executiveOverview} />

          <div className={PORTAL_GRID_CLASS}>
            <CreatorAnalyticsPanel analytics={workspace.creatorAnalytics} />
            <CampaignAnalyticsPanel analytics={workspace.campaignAnalytics} />
          </div>

          <div className={PORTAL_GRID_CLASS}>
            <RecruitingAnalyticsPanel analytics={workspace.recruitingAnalytics} />
            <LiveAnalyticsPanel analytics={workspace.liveAnalytics} />
          </div>

          <IntelligenceDashboardPanel intelligence={workspace.intelligence} />

          <WorkspaceSection title="Export center">
            <ExportCenterPanel exportCenter={workspace.exportCenter} />
          </WorkspaceSection>
        </div>
      ) : null}
    </WorkspaceDataPage>
  );
}
