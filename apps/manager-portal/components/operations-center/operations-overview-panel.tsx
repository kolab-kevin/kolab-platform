import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerOperationsOverview } from '@/types/operations-center';

type OperationsOverviewPanelProps = {
  overview: ManagerOperationsOverview;
};

export function OperationsOverviewPanel({ overview }: OperationsOverviewPanelProps) {
  const metrics = [
    { label: 'Open tasks', value: overview.openTasks },
    { label: 'Critical alerts', value: overview.criticalAlerts },
    { label: 'Overdue follow-ups', value: overview.overdueFollowUps },
    { label: 'Campaign deadlines', value: overview.campaignDeadlines },
    { label: 'Live issues', value: overview.liveIssues },
    { label: 'Compliance issues', value: overview.complianceIssues },
  ];

  return (
    <WorkspaceCard title="Operations overview" description="Daily command metrics at a glance">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3"
          >
            <div className="text-muted-foreground text-xs uppercase tracking-wide">
              {metric.label}
            </div>
            <div className="mt-1 text-lg font-semibold">{metric.value}</div>
          </div>
        ))}
      </div>
    </WorkspaceCard>
  );
}
