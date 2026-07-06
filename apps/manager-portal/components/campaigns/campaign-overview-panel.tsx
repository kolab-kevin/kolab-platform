import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerCampaignOverview } from '@/types/campaign-operations';

type CampaignOverviewPanelProps = {
  overview: ManagerCampaignOverview;
};

export function CampaignOverviewPanel({ overview }: CampaignOverviewPanelProps) {
  const metrics = [
    { label: 'Active campaigns', value: overview.activeCount },
    { label: 'Upcoming campaigns', value: overview.upcomingCount },
    { label: 'Completed campaigns', value: overview.completedCount },
    { label: 'Campaign health', value: overview.healthLabel },
    { label: 'Budget summary', value: overview.budgetSummary },
    { label: 'Creator participation', value: overview.creatorParticipation },
  ];

  return (
    <WorkspaceCard title="Campaign overview" description="Portfolio campaign health at a glance">
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
