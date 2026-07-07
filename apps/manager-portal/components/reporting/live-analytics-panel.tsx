import { WorkspaceCard } from '@/components/common/workspace-layout';
import { MetricCard } from '@/components/reporting/metric-card';
import type { ManagerLiveAnalytics } from '@/types/reporting-workspace';

type LiveAnalyticsPanelProps = {
  analytics: ManagerLiveAnalytics;
};

export function LiveAnalyticsPanel({ analytics }: LiveAnalyticsPanelProps) {
  return (
    <WorkspaceCard title="Live analytics" description="Session performance and engagement trends">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Sessions" value={String(analytics.sessionCount)} />
        <MetricCard label="Live hours" value={analytics.liveHoursLabel} trend="up" />
        <MetricCard label="Viewer trends" value={analytics.viewerTrendLabel} trend="up" />
        <MetricCard label="Gift trends" value={analytics.giftTrendLabel} trend="up" />
        <MetricCard label="Engagement" value={analytics.engagementLabel} />
      </div>
    </WorkspaceCard>
  );
}
