import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerRecruitingOverview } from '@/types/recruiting-workspace';

type RecruitingOverviewPanelProps = {
  overview: ManagerRecruitingOverview;
};

export function RecruitingOverviewPanel({ overview }: RecruitingOverviewPanelProps) {
  const metrics = [
    { label: 'Total prospects', value: overview.totalProspects },
    { label: 'New leads', value: overview.newLeads },
    { label: 'Active conversations', value: overview.activeConversations },
    { label: 'Pending follow-ups', value: overview.pendingFollowUps },
    { label: 'Signed creators', value: overview.signedCreators },
    { label: 'Conversion funnel', value: overview.conversionFunnel },
  ];

  return (
    <WorkspaceCard title="Recruiting overview" description="Pipeline health at a glance">
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
