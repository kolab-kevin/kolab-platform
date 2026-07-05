import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import type { CoachOverviewDisplayModel } from '@/types/coach-adapters';

type CoachOverviewSectionProps = {
  overview: CoachOverviewDisplayModel;
};

export function CoachOverviewSection({ overview }: CoachOverviewSectionProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Coach Overview</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Current priority</p>
          <p className="mt-1 font-medium">{overview.currentPriority ?? '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Today&apos;s focus
          </p>
          <p className="mt-1 font-medium">{overview.todaysFocus ?? '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Overall intelligence score
          </p>
          <p className="mt-1 text-2xl font-bold">
            {overview.overallIntelligenceScore ?? '—'}
            {overview.overallIntelligenceScore !== null ? (
              <span className="text-muted-foreground text-base font-normal"> / 100</span>
            ) : null}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Coaching status</p>
          <p className="mt-1 font-medium">{overview.coachingStatus}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Last updated</p>
          <p className="mt-1 font-medium">
            {overview.lastUpdated ? new Date(overview.lastUpdated).toLocaleString() : '—'}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Session</p>
          <p className="mt-1 font-medium">{overview.sessionId ?? 'No recent session'}</p>
        </div>
      </CardContent>
    </Card>
  );
}
