'use client';

import { WorkspaceDataPage } from '@/components/common/workspace-data-page';
import {
  AgencyOverviewCard,
  CampaignHealthCard,
  ComplianceBlockersCard,
  CreatorHealthCard,
  LiveOperationsCard,
  RecruitingPipelineCard,
  RevenuePlaceholderCard,
  TasksAlertsCard,
} from '@/components/dashboard/dashboard-cards';
import { useOrganization } from '@/contexts/organization-context';
import { useManagerDashboard } from '@/hooks/use-manager-dashboard';

export function DashboardView() {
  const { activeOrganization } = useOrganization();
  const { data, loading, error, refresh } = useManagerDashboard(activeOrganization.id);

  return (
    <WorkspaceDataPage
      title="Dashboard"
      fallbackDescription={`${activeOrganization.name} · Agency command overview`}
      loadedDescription={
        data
          ? `${activeOrganization.name} · Updated ${new Date(data.generatedAt).toLocaleString()}`
          : undefined
      }
      loading={loading}
      loadingLabel="Loading dashboard…"
      error={error}
      errorTitle="Unable to load dashboard"
      source="mock"
      emptyMessage="No dashboard data is available yet."
      onRefresh={refresh}
    >
      {data ? (
        <div className="grid gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-8">
            <AgencyOverviewCard overview={data.agencyOverview} />
            <div className="grid gap-4 md:grid-cols-2">
              <CreatorHealthCard health={data.creatorHealth} />
              <CampaignHealthCard campaigns={data.campaignHealth} />
            </div>
            <LiveOperationsCard live={data.liveOperations} />
            <RecruitingPipelineCard recruiting={data.recruitingPipeline} />
          </div>
          <div className="space-y-4 xl:col-span-4">
            <TasksAlertsCard tasks={data.tasksAndAlerts} />
            <RevenuePlaceholderCard revenue={data.revenue} />
            <ComplianceBlockersCard compliance={data.complianceBlockers} />
          </div>
        </div>
      ) : null}
    </WorkspaceDataPage>
  );
}
