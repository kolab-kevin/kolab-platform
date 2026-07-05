import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import { ScoreBandBadge } from '@/components/common/score-band-badge';
import type { PerformanceWorkspaceData } from '@/types/performance-adapters';
import { formatTrendDirection } from '@/types/performance-adapters';

type PerformanceScoreHeaderProps = {
  score: PerformanceWorkspaceData;
};

export function PerformanceScoreHeader({ score }: PerformanceScoreHeaderProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Overall Score</CardTitle>
          <ScoreBandBadge band={score.scoreBand} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Score</p>
          <p className="mt-1 text-3xl font-bold">
            {score.overallScore}
            <span className="text-muted-foreground text-base font-normal"> / 100</span>
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Band</p>
          <p className="mt-1 text-lg font-semibold">{score.scoreBand.replaceAll('_', ' ')}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Trend</p>
          <p className="mt-1 text-lg font-semibold">{formatTrendDirection(score.trendDirection)}</p>
        </div>
        <div className="text-muted-foreground text-xs sm:col-span-3">
          Generated {new Date(score.generatedAt).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
