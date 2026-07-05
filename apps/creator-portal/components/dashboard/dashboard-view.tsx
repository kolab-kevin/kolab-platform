'use client';

import { Button } from '@kolab/ui';

import { InlineLoading } from '@/components/common/global-loading';
import { CampaignsCard } from '@/components/dashboard/campaigns-card';
import { CoachCard } from '@/components/dashboard/coach-card';
import { GoalsCard } from '@/components/dashboard/goals-card';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { PerformanceCard } from '@/components/dashboard/performance-card';
import { QuickActionsCard } from '@/components/dashboard/quick-actions-card';
import { useDashboard } from '@/hooks/use-dashboard';

function sourceLabel(source: NonNullable<ReturnType<typeof useDashboard>['source']>): string {
  switch (source) {
    case 'mock':
      return 'Mock data';
    case 'live':
      return 'Live API';
    case 'empty':
      return 'No dashboard data yet';
    default:
      return source;
  }
}

export function DashboardView() {
  const { data, loading, error, source, refresh } = useDashboard();

  if (loading) {
    return <InlineLoading label="Loading dashboard…" />;
  }

  if (error || !data) {
    return (
      <div className="border-destructive/30 bg-destructive/10 rounded-xl border p-6 text-center">
        <h2 className="text-lg font-semibold">Unable to load dashboard</h2>
        <p className="text-muted-foreground mt-2 text-sm">{error ?? 'Unknown error'}</p>
        <Button className="mt-4" onClick={() => void refresh()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Updated {new Date(data.generatedAt).toLocaleString()}
            {source ? ` · ${sourceLabel(source)}` : null}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>

      {source === 'empty' ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          No dashboard has been generated for this creator yet. Complete onboarding or ask your
          agency manager to generate intelligence data.
        </div>
      ) : null}

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
    </div>
  );
}
