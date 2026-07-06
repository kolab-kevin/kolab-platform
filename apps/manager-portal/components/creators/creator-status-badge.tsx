import { cn } from '@kolab/ui';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-300',
  SUSPENDED: 'bg-amber-500/15 text-amber-300',
  REMOVED: 'bg-red-500/15 text-red-300',
  COMPLETE: 'bg-emerald-500/15 text-emerald-300',
  INCOMPLETE: 'bg-amber-500/15 text-amber-300',
  WARNING: 'bg-amber-500/15 text-amber-300',
  COMPLIANT: 'bg-emerald-500/15 text-emerald-300',
  AT_RISK: 'bg-orange-500/15 text-orange-300',
  BLOCKED: 'bg-red-500/15 text-red-300',
  STRONG: 'bg-blue-500/15 text-blue-300',
  EXCELLENT: 'bg-emerald-500/15 text-emerald-300',
  DEVELOPING: 'bg-amber-500/15 text-amber-300',
};

type CreatorStatusBadgeProps = {
  label: string;
  className?: string;
};

export function CreatorStatusBadge({ label, className }: CreatorStatusBadgeProps) {
  const style = STATUS_STYLES[label] ?? 'bg-muted text-muted-foreground';

  return (
    <span
      className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', style, className)}
    >
      {label}
    </span>
  );
}
