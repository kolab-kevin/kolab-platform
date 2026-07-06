import { cn } from '@kolab/ui';

import type { ManagerLiveSessionHealth } from '@/types/live-operations';

const HEALTH_STYLES: Record<ManagerLiveSessionHealth, string> = {
  EXCELLENT: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  GOOD: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
  WARNING: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
  CRITICAL: 'border-rose-500/30 bg-rose-500/10 text-rose-100',
  UNKNOWN: 'border-white/10 bg-white/5 text-muted-foreground',
};

export function LiveHealthBadge({
  health,
  score,
}: {
  health: ManagerLiveSessionHealth;
  score: number | null;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium',
        HEALTH_STYLES[health],
      )}
    >
      {score != null ? `${score}` : health}
    </span>
  );
}

export function LiveStatusBadge({ status }: { status: string }) {
  const tone =
    status === 'LIVE'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
      : status === 'SCHEDULED'
        ? 'border-sky-500/30 bg-sky-500/10 text-sky-100'
        : status === 'ENDED'
          ? 'border-white/10 bg-white/5 text-muted-foreground'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-100';

  return (
    <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-medium', tone)}>
      {status}
    </span>
  );
}
