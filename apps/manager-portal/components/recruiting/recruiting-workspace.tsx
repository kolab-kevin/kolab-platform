'use client';

import { WorkspaceDataPage } from '@/components/common/workspace-data-page';
import { WorkspaceSection } from '@/components/common/workspace-layout';
import { FollowUpQueuePanel } from '@/components/recruiting/followup-queue-panel';
import { PipelineBoardPanel } from '@/components/recruiting/pipeline-board-panel';
import { ProspectDetailPanel } from '@/components/recruiting/prospect-detail-panel';
import { QuickActionsPanel } from '@/components/recruiting/quick-actions-panel';
import { RecruiterPerformancePanel } from '@/components/recruiting/recruiter-performance-panel';
import { RecruitingOverviewPanel } from '@/components/recruiting/recruiting-overview-panel';
import { useRecruitingWorkspace } from '@/hooks/use-recruiting-workspace';

export function RecruitingWorkspace() {
  const {
    workspace,
    selectedProspectId,
    loading,
    detailLoading,
    error,
    detailError,
    source,
    selectProspect,
    refresh,
  } = useRecruitingWorkspace();

  return (
    <WorkspaceDataPage
      title="Recruiting"
      fallbackDescription="Lead pipeline and conversion workflows"
      loadedDescription={
        workspace ? `${workspace.prospects.length} prospects in pipeline` : undefined
      }
      loading={loading}
      loadingLabel="Loading recruiting workspace…"
      error={error}
      errorTitle="Unable to load recruiting workspace"
      source={source}
      emptyMessage="No prospects are available in this organization yet."
      onRefresh={refresh}
    >
      {workspace ? (
        <div className="space-y-6">
          <WorkspaceSection title="Quick actions">
            <QuickActionsPanel />
          </WorkspaceSection>

          <RecruitingOverviewPanel overview={workspace.overview} />

          <PipelineBoardPanel
            pipeline={workspace.pipeline}
            selectedProspectId={selectedProspectId}
            onSelectProspect={selectProspect}
          />

          <div className="grid gap-4 xl:grid-cols-12">
            <div className="space-y-4 xl:col-span-7">
              <ProspectDetailPanel
                detail={workspace.detail}
                loading={detailLoading}
                error={detailError}
              />
              <FollowUpQueuePanel followUpQueue={workspace.followUpQueue} />
            </div>
            <div className="xl:col-span-5">
              <RecruiterPerformancePanel recruiterPerformance={workspace.recruiterPerformance} />
            </div>
          </div>
        </div>
      ) : null}
    </WorkspaceDataPage>
  );
}
