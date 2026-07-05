'use client';

import dynamic from 'next/dynamic';

import { ApplicationsSection } from '@/components/campaigns/applications-section';
import { CampaignViewToolbar } from '@/components/campaigns/campaign-view-toolbar';
import { DeliverablesSection } from '@/components/campaigns/deliverables-section';
import { EmptyWorkspaceState } from '@/components/common/empty-workspace-state';
import { LoadingSkeleton } from '@/components/common/workspace-loading';
import { PartialWorkspaceNotice, WorkspacePage } from '@/components/common/workspace-page';
import { useCampaignWorkspace } from '@/hooks/use-campaign-workspace';

const CampaignListView = dynamic(
  () =>
    import('@/components/campaigns/campaign-list-view').then((m) => ({
      default: m.CampaignListView,
    })),
  { loading: () => <LoadingSkeleton rows={4} label="Loading campaign list" /> },
);

const CampaignKanbanView = dynamic(
  () =>
    import('@/components/campaigns/campaign-kanban-view').then((m) => ({
      default: m.CampaignKanbanView,
    })),
  { loading: () => <LoadingSkeleton rows={4} label="Loading campaign board" /> },
);

const CampaignDetailPanel = dynamic(
  () =>
    import('@/components/campaigns/campaign-detail-panel').then((m) => ({
      default: m.CampaignDetailPanel,
    })),
  { loading: () => <LoadingSkeleton rows={5} label="Loading campaign details" /> },
);

export function CampaignWorkspace() {
  const {
    data,
    loading,
    error,
    source,
    view,
    selectedCampaignId,
    setView,
    selectCampaign,
    refresh,
  } = useCampaignWorkspace();

  const totalAssigned = data.assignedCampaigns.length;
  const totalDeliverables = Object.values(data.deliverables).reduce(
    (count, items) => count + items.length,
    0,
  );
  const totalApplications = Object.values(data.applications).reduce(
    (count, items) => count + items.length,
    0,
  );

  return (
    <WorkspacePage
      title="Campaigns"
      description={`${totalAssigned} assigned · ${totalDeliverables} deliverables · ${totalApplications} applications`}
      source={source}
      loading={loading}
      loadingLabel="Loading campaign workspace…"
      error={error}
      errorTitle="Unable to load campaigns"
      onRetry={() => void refresh()}
      emptyNotice={
        source === 'empty' &&
        totalAssigned === 0 &&
        totalDeliverables === 0 &&
        totalApplications === 0 ? (
          <EmptyWorkspaceState message="No campaign assignments or applications are available yet." />
        ) : null
      }
      partialNotice={
        source === 'partial' ? (
          <PartialWorkspaceNotice message="Some campaign data could not be loaded. Showing available results." />
        ) : null
      }
    >
      <CampaignViewToolbar view={view} onViewChange={setView} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {view === 'list' ? (
            <CampaignListView
              campaigns={data.assignedCampaigns}
              selectedCampaignId={selectedCampaignId}
              onSelectCampaign={selectCampaign}
            />
          ) : view === 'kanban' ? (
            <CampaignKanbanView
              campaigns={data.assignedCampaigns}
              selectedCampaignId={selectedCampaignId}
              onSelectCampaign={selectCampaign}
            />
          ) : (
            <div className="text-muted-foreground border-border/60 rounded-lg border border-dashed px-4 py-6 text-sm">
              Calendar view will be available in a future update.
            </div>
          )}

          <DeliverablesSection deliverables={data.deliverables} />
          <ApplicationsSection applications={data.applications} />
        </div>

        <CampaignDetailPanel
          campaignId={selectedCampaignId}
          data={data}
          onClose={() => selectCampaign(null)}
        />
      </div>
    </WorkspacePage>
  );
}
