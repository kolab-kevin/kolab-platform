import type { LiveCoachAlertPriority, LiveRecommendationPriority } from '@kolab/types';
import { cn } from '@kolab/ui';

import { formatCoachLabel } from '@/types/coach-adapters';

type PriorityBadgeProps = {
  priority: LiveRecommendationPriority | LiveCoachAlertPriority;
  className?: string;
};

function priorityClass(priority: LiveRecommendationPriority | LiveCoachAlertPriority): string {
  switch (priority) {
    case 'HIGH':
      return 'border-red-500/30 bg-red-500/10 text-red-200';
    case 'MEDIUM':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
    case 'LOW':
      return 'border-primary/30 bg-primary/10 text-primary';
    default:
      return 'border-white/10 bg-white/5 text-muted-foreground';
  }
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide',
        priorityClass(priority),
        className,
      )}
    >
      {formatCoachLabel(priority)}
    </span>
  );
}
