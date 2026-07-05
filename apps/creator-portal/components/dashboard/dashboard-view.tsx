'use client';

import { EmptyWorkspaceState, WorkspacePage } from '@/components/common/workspace-page';
import { CampaignsCard } from '@/components/dashboard/campaigns-card';
import { CoachCard } from '@/components/dashboard/coach-card';
import { GoalsCard } from '@/components/dashboard/goals-card';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { PerformanceCard } from '@/components/dashboard/performance-card';
import { QuickActionsCard } from '@/components/dashboard/quick-actions-card';
import { useDashboard } from '@/hooks/use-dashboard';

export function DashboardView() {
  const { data, loading, error, source, refresh } = useDashboard();

  return (
    <WorkspacePage
      title="Dashboard"
      description={
        data ? `Updated ${new Date(data.generatedAt).toLocaleString()}` : 'Creator overview'
      }
      source={source}
      loading={loading}
      loadingLabel="Loading dashboard…"
      error={error ?? (!data && !loading ? 'Unknown error' : null)}
      errorTitle="Unable to load dashboard"
      onRetry={() => void refresh()}
      emptyNotice={
        source === 'empty' ? (
          <EmptyWorkspaceState message="No dashboard has been generated for this creator yet. Complete onboarding or ask your agency manager to generate intelligence data." />
        ) : null
      }
    >
      {data ? (
        <div className="grid gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-8">
            <OverviewCard overview={data.overview} />
            <div className="grid gap-4 md:grid-cols-2">
              <GoalsCard goals={data.todaysGoals} />
              <CampaignsCard campaigns={data.upcomingCampaigns} deliverables={data.deliverables} />
            </div>
            <PerformanceCard
              performance={data.performance}
              performanceScore={data.overview.performanceScore}
              liveTrendDirection={data.overview.liveTrendDirection}
            />
          </div>
          <div className="space-y-4 xl:col-span-4">
            <CoachCard coach={data.coach} />
            <QuickActionsCard actions={data.quickActions} />
          </div>
        </div>
      ) : null}
    </WorkspacePage>
  );
}
