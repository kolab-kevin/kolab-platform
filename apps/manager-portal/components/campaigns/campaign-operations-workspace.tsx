'use client';

import { CampaignApplicationsPanel } from '@/components/campaigns/campaign-applications-panel';
import { CampaignBoardPanel } from '@/components/campaigns/campaign-board-panel';
import { CampaignDeliverablesPanel } from '@/components/campaigns/campaign-deliverables-panel';
import { CampaignDetailPanel } from '@/components/campaigns/campaign-detail-panel';
import { CampaignOverviewPanel } from '@/components/campaigns/campaign-overview-panel';
import { CampaignQuickActions } from '@/components/campaigns/campaign-quick-actions';
import { WorkspaceDataPage } from '@/components/common/workspace-data-page';
import { WorkspaceSection } from '@/components/common/workspace-layout';
import { useCampaignOperations } from '@/hooks/use-campaign-operations';

export function CampaignOperationsWorkspace() {
  const {
    workspace,
    selectedCampaignId,
    loading,
    detailLoading,
    error,
    detailError,
    source,
    selectCampaign,
    refresh,
  } = useCampaignOperations();

  return (
    <WorkspaceDataPage
      title="Campaigns"
      fallbackDescription="Campaign pipeline and deliverable oversight"
      loadedDescription={
        workspace ? `${workspace.campaigns.length} campaigns in portfolio` : undefined
      }
      loading={loading}
      loadingLabel="Loading campaign operations…"
      error={error}
      errorTitle="Unable to load campaign operations"
      source={source}
      emptyMessage="No campaigns are available in this organization yet."
      onRefresh={refresh}
    >
      {workspace ? (
        <div className="space-y-6">
          <WorkspaceSection title="Quick actions">
            <CampaignQuickActions />
          </WorkspaceSection>

          <CampaignOverviewPanel overview={workspace.overview} />

          <CampaignBoardPanel
            board={workspace.board}
            selectedCampaignId={selectedCampaignId}
            onSelectCampaign={selectCampaign}
          />

          <div className="grid gap-4 xl:grid-cols-12">
            <div className="space-y-4 xl:col-span-7">
              <CampaignDetailPanel
                detail={workspace.detail}
                loading={detailLoading}
                error={detailError}
              />
              <CampaignDeliverablesPanel deliverables={workspace.deliverables} />
            </div>
            <div className="xl:col-span-5">
              <CampaignApplicationsPanel applications={workspace.applications} />
            </div>
          </div>
        </div>
      ) : null}
    </WorkspaceDataPage>
  );
}
