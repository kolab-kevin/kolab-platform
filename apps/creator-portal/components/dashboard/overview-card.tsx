import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import type { DashboardOverview } from '@/types/dashboard';

type OverviewCardProps = {
  overview: DashboardOverview;
};

function formatTrend(direction: DashboardOverview['liveTrendDirection']): string {
  if (!direction) return 'No trend data';
  switch (direction) {
    case 'IMPROVING':
      return 'Improving';
    case 'DECLINING':
      return 'Declining';
    case 'STABLE':
      return 'Stable';
    case 'INSUFFICIENT_DATA':
      return 'Insufficient data';
    default:
      return direction;
  }
}

export function OverviewCard({ overview }: OverviewCardProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Overview</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Creator</p>
          <p className="mt-1 text-lg font-semibold">{overview.displayName ?? 'Creator'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Performance</p>
          <p className="mt-1 text-lg font-semibold">
            {overview.performanceScore ?? '—'}
            {overview.performanceScore != null ? (
              <span className="text-muted-foreground text-sm"> / 100</span>
            ) : null}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Intelligence</p>
          <p className="mt-1 text-lg font-semibold">
            {overview.overallIntelligenceScore ?? '—'}
            {overview.overallIntelligenceScore != null ? (
              <span className="text-muted-foreground text-sm"> / 100</span>
            ) : null}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Live trend</p>
          <p className="mt-1 text-lg font-semibold">{formatTrend(overview.liveTrendDirection)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
