import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import type { DashboardPerformance } from '@/types/dashboard';

type PerformanceCardProps = {
  performance: DashboardPerformance;
  performanceScore?: number | null;
  liveTrendDirection?: string | null;
};

export function PerformanceCard({
  performance,
  performanceScore = null,
  liveTrendDirection = null,
}: PerformanceCardProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Performance</CardTitle>
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            {performanceScore != null ? (
              <span>
                Score: <strong className="text-foreground">{performanceScore}</strong>/100
              </span>
            ) : null}
            {liveTrendDirection ? <span>Trend: {liveTrendDirection}</span> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {performance.trendSummary ? (
          <p className="text-sm leading-relaxed">{performance.trendSummary}</p>
        ) : (
          <p className="text-muted-foreground text-sm">No performance summary available.</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
              Strengths
            </p>
            <ul className="space-y-1 text-sm">
              {performance.strongestAreas.length === 0 ? (
                <li className="text-muted-foreground">—</li>
              ) : (
                performance.strongestAreas.map((area) => <li key={area}>{area}</li>)
              )}
            </ul>
          </div>
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
              Focus areas
            </p>
            <ul className="space-y-1 text-sm">
              {performance.weakestAreas.length === 0 ? (
                <li className="text-muted-foreground">—</li>
              ) : (
                performance.weakestAreas.map((area) => <li key={area}>{area}</li>)
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
