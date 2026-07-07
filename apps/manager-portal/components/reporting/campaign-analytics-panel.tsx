import { WorkspaceCard } from '@/components/common/workspace-layout';
import { MetricCard } from '@/components/reporting/metric-card';
import type { ManagerCampaignAnalytics } from '@/types/reporting-workspace';

type CampaignAnalyticsPanelProps = {
  analytics: ManagerCampaignAnalytics;
};

export function CampaignAnalyticsPanel({ analytics }: CampaignAnalyticsPanelProps) {
  return (
    <WorkspaceCard title="Campaign analytics" description="Campaign portfolio performance">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Active campaigns" value={String(analytics.activeCampaigns)} />
        <MetricCard label="Completion rate" value={analytics.completionRateLabel} trend="up" />
        <MetricCard label="Deliverables" value={analytics.deliverablesSummary} />
        <MetricCard label="Revenue" value={analytics.revenueLabel} />
        <MetricCard label="ROI" value={analytics.roiLabel} />
      </div>
    </WorkspaceCard>
  );
}
