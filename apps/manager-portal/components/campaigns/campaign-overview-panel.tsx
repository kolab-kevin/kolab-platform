import { WorkspaceCard } from '@/components/common/workspace-layout';
import { WorkspaceMetricsGrid } from '@/components/common/workspace-metrics-grid';
import type { ManagerCampaignOverview } from '@/types/campaign-operations';

type CampaignOverviewPanelProps = {
  overview: ManagerCampaignOverview;
};

export function CampaignOverviewPanel({ overview }: CampaignOverviewPanelProps) {
  return (
    <WorkspaceCard title="Campaign overview" description="Portfolio campaign health at a glance">
      <WorkspaceMetricsGrid
        metrics={[
          { label: 'Active campaigns', value: overview.activeCount },
          { label: 'Upcoming campaigns', value: overview.upcomingCount },
          { label: 'Completed campaigns', value: overview.completedCount },
          { label: 'Campaign health', value: overview.healthLabel },
          { label: 'Budget summary', value: overview.budgetSummary },
          { label: 'Creator participation', value: overview.creatorParticipation },
        ]}
      />
    </WorkspaceCard>
  );
}
