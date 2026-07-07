import { WorkspaceCard } from '@/components/common/workspace-layout';
import { WorkspaceMetricsGrid } from '@/components/common/workspace-metrics-grid';
import type { ManagerOperationsOverview } from '@/types/operations-center';

type OperationsOverviewPanelProps = {
  overview: ManagerOperationsOverview;
};

export function OperationsOverviewPanel({ overview }: OperationsOverviewPanelProps) {
  return (
    <WorkspaceCard title="Operations overview" description="Daily command metrics at a glance">
      <WorkspaceMetricsGrid
        metrics={[
          { label: 'Open tasks', value: overview.openTasks },
          { label: 'Critical alerts', value: overview.criticalAlerts },
          { label: 'Overdue follow-ups', value: overview.overdueFollowUps },
          { label: 'Campaign deadlines', value: overview.campaignDeadlines },
          { label: 'Live issues', value: overview.liveIssues },
          { label: 'Compliance issues', value: overview.complianceIssues },
        ]}
      />
    </WorkspaceCard>
  );
}
