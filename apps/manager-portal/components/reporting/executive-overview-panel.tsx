import { WorkspaceCard } from '@/components/common/workspace-layout';
import { MetricCard } from '@/components/reporting/metric-card';
import type { ManagerExecutiveOverview } from '@/types/reporting-workspace';

type ExecutiveOverviewPanelProps = {
  overview: ManagerExecutiveOverview;
};

export function ExecutiveOverviewPanel({ overview }: ExecutiveOverviewPanelProps) {
  return (
    <WorkspaceCard
      title="Executive overview"
      description={`Organization health: ${overview.healthLabel} (${overview.organizationHealthScore})`}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total creators"
          value={String(overview.totalCreators)}
          trend="up"
          trendLabel="portfolio"
        />
        <MetricCard label="Active creators" value={String(overview.activeCreators)} trend="flat" />
        <MetricCard
          label="Revenue"
          value={overview.revenueLabel}
          trend="up"
          trendLabel="gift revenue"
        />
        <MetricCard label="Live hours" value={overview.liveHoursLabel} trend="up" />
        <MetricCard
          label="Active campaigns"
          value={String(overview.activeCampaigns)}
          trend="flat"
        />
        <MetricCard label="Recruiting funnel" value={overview.recruitingFunnelLabel} />
        <MetricCard
          label="Health score"
          value={String(overview.organizationHealthScore)}
          trend={overview.organizationHealthScore >= 70 ? 'up' : 'down'}
          trendLabel={overview.healthLabel}
        />
      </div>
    </WorkspaceCard>
  );
}
