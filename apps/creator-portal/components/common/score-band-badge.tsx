import type { CreatorPerformanceScore } from '@kolab/types';
import { cn } from '@kolab/ui';

import { formatScoreBand } from '@/types/performance-adapters';

type ScoreBandBadgeProps = {
  band: CreatorPerformanceScore['scoreBand'];
  className?: string;
};

function bandClass(band: CreatorPerformanceScore['scoreBand']): string {
  switch (band) {
    case 'EXCELLENT':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
    case 'GOOD':
      return 'border-primary/30 bg-primary/10 text-primary';
    case 'FAIR':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
    case 'NEEDS_ATTENTION':
      return 'border-orange-500/30 bg-orange-500/10 text-orange-100';
    case 'HIGH_RISK':
      return 'border-red-500/30 bg-red-500/10 text-red-200';
    default:
      return 'border-white/10 bg-white/5 text-muted-foreground';
  }
}

export function ScoreBandBadge({ band, className }: ScoreBandBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
        bandClass(band),
        className,
      )}
    >
      {formatScoreBand(band)}
    </span>
  );
}
