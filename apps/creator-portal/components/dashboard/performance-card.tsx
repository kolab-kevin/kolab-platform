import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import type { DashboardPerformance } from '@/types/dashboard';

type PerformanceCardProps = {
  performance: DashboardPerformance;
};

export function PerformanceCard({ performance }: PerformanceCardProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Performance</CardTitle>
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
