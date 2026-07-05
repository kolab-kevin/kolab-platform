import type { CreatorGoalStatus } from '@kolab/types';
import { cn } from '@kolab/ui';

import { formatGoalStatus } from '@/types/goal-adapters';

type StatusBadgeProps = {
  status: CreatorGoalStatus;
  className?: string;
};

function statusClass(status: CreatorGoalStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'border-primary/30 bg-primary/10 text-primary';
    case 'COMPLETED':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
    case 'MISSED':
      return 'border-red-500/30 bg-red-500/10 text-red-200';
    default:
      return 'border-white/10 bg-white/5 text-muted-foreground';
  }
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide',
        statusClass(status),
        className,
      )}
    >
      {formatGoalStatus(status)}
    </span>
  );
}
