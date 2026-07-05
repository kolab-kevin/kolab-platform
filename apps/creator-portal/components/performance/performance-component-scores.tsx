import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import { ProgressBar } from '@/components/common/progress-bar';
import type { PerformanceComponentScore } from '@/types/performance-adapters';

type PerformanceComponentScoresProps = {
  components: PerformanceComponentScore[];
};

export function PerformanceComponentScores({ components }: PerformanceComponentScoresProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Component Scores</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-4 sm:grid-cols-2">
          {components.map((component) => (
            <li key={component.key}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">{component.label}</span>
                <span className="text-muted-foreground">{component.value}/100</span>
              </div>
              <ProgressBar percent={component.value} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
