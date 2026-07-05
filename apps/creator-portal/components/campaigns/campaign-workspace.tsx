'use client';

import { Button } from '@kolab/ui';

import { ApplicationsSection } from '@/components/campaigns/applications-section';
import { CampaignDetailPanel } from '@/components/campaigns/campaign-detail-panel';
import { CampaignKanbanView } from '@/components/campaigns/campaign-kanban-view';
import { CampaignListView } from '@/components/campaigns/campaign-list-view';
import { CampaignViewToolbar } from '@/components/campaigns/campaign-view-toolbar';
import { DeliverablesSection } from '@/components/campaigns/deliverables-section';
import { InlineLoading } from '@/components/common/global-loading';
import { WorkspaceError } from '@/components/common/workspace-error';
import { useCampaignWorkspace } from '@/hooks/use-campaign-workspace';

function sourceLabel(
  source: NonNullable<ReturnType<typeof useCampaignWorkspace>['source']>,
): string {
  switch (source) {
    case 'mock':
      return 'Mock data';
    case 'live':
      return 'Live API';
    case 'empty':
      return 'No campaigns yet';
    case 'partial':
      return 'Partial API data';
    default:
      return source;
  }
}

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

  if (loading) {
    return <InlineLoading label="Loading campaign workspace…" />;
  }

  if (error) {
    return (
      <WorkspaceError
        title="Unable to load campaigns"
        message={error}
        onRetry={() => void refresh()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground text-sm">
            {totalAssigned} assigned · {totalDeliverables} deliverables · {totalApplications}{' '}
            applications
            {source ? ` · ${sourceLabel(source)}` : null}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>

      {source === 'empty' &&
      totalAssigned === 0 &&
      totalDeliverables === 0 &&
      totalApplications === 0 ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          No campaign assignments or applications are available yet.
        </div>
      ) : null}

      {source === 'partial' ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Some campaign data could not be loaded. Showing available results.
        </div>
      ) : null}

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
    </div>
  );
}
