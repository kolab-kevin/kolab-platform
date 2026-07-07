import { WorkspaceCard } from '@/components/common/workspace-layout';
import { WorkspaceMetricsGrid } from '@/components/common/workspace-metrics-grid';
import type { ManagerRecruitingOverview } from '@/types/recruiting-workspace';

type RecruitingOverviewPanelProps = {
  overview: ManagerRecruitingOverview;
};

export function RecruitingOverviewPanel({ overview }: RecruitingOverviewPanelProps) {
  return (
    <WorkspaceCard title="Recruiting overview" description="Pipeline health at a glance">
      <WorkspaceMetricsGrid
        metrics={[
          { label: 'Total prospects', value: overview.totalProspects },
          { label: 'New leads', value: overview.newLeads },
          { label: 'Active conversations', value: overview.activeConversations },
          { label: 'Pending follow-ups', value: overview.pendingFollowUps },
          { label: 'Signed creators', value: overview.signedCreators },
          { label: 'Conversion funnel', value: overview.conversionFunnel },
        ]}
      />
    </WorkspaceCard>
  );
}
