'use client';

import { Button } from '@kolab/ui';

import { WorkspaceSection } from '@/components/common/workspace-layout';
import { EmptyWorkspaceState, WorkspacePage } from '@/components/common/workspace-page';
import { CampaignAnalyticsPanel } from '@/components/reporting/campaign-analytics-panel';
import { CreatorAnalyticsPanel } from '@/components/reporting/creator-analytics-panel';
import { ExecutiveOverviewPanel } from '@/components/reporting/executive-overview-panel';
import { ExportCenterPanel } from '@/components/reporting/export-center-panel';
import { IntelligenceDashboardPanel } from '@/components/reporting/intelligence-dashboard-panel';
import { LiveAnalyticsPanel } from '@/components/reporting/live-analytics-panel';
import { RecruitingAnalyticsPanel } from '@/components/reporting/recruiting-analytics-panel';
import { useReportingWorkspace } from '@/hooks/use-reporting-workspace';

export function ReportingWorkspace() {
  const { workspace, loading, error, source, refresh } = useReportingWorkspace();

  const sourceLabel =
    source === 'mock'
      ? 'Mock data'
      : source === 'partial'
        ? 'Partial API data'
        : source === 'live'
          ? 'Live API data'
          : undefined;

  return (
    <WorkspacePage
      title="Reports"
      description={
        workspace
          ? `Health score ${workspace.executiveOverview.organizationHealthScore}${sourceLabel ? ` · ${sourceLabel}` : ''}`
          : 'Agency analytics and exports'
      }
      loading={loading}
      loadingLabel="Loading reporting workspace…"
      error={error}
      errorTitle="Unable to load reporting workspace"
      onRetry={() => void refresh()}
      actions={
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      }
      emptyNotice={
        source === 'empty' ? (
          <EmptyWorkspaceState message="No reporting data is available in this organization yet." />
        ) : null
      }
    >
      {workspace ? (
        <div className="space-y-6">
          <ExecutiveOverviewPanel overview={workspace.executiveOverview} />

          <div className="grid gap-4 xl:grid-cols-2">
            <CreatorAnalyticsPanel analytics={workspace.creatorAnalytics} />
            <CampaignAnalyticsPanel analytics={workspace.campaignAnalytics} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <RecruitingAnalyticsPanel analytics={workspace.recruitingAnalytics} />
            <LiveAnalyticsPanel analytics={workspace.liveAnalytics} />
          </div>

          <IntelligenceDashboardPanel intelligence={workspace.intelligence} />

          <WorkspaceSection title="Export center">
            <ExportCenterPanel exportCenter={workspace.exportCenter} />
          </WorkspaceSection>
        </div>
      ) : null}
    </WorkspacePage>
  );
}
