import { cn } from '@kolab/ui';

type ProgressBarProps = {
  percent: number;
  className?: string;
};

export function ProgressBar({ percent, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className={cn('bg-muted h-2 overflow-hidden rounded-full', className)}>
      <div
        className="bg-primary h-full rounded-full transition-all"
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
