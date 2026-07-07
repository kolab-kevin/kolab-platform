import { cn } from '@kolab/ui';

const STATUS_STYLES = {
  neutral: 'border-white/20 bg-white/5 text-muted-foreground',
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
  warning: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
  danger: 'border-red-400/30 bg-red-400/10 text-red-100',
} as const;

type StatusBadgeProps = {
  label: string;
  tone?: keyof typeof STATUS_STYLES;
  className?: string;
};

export function StatusBadge({ label, tone = 'neutral', className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2 py-0.5 text-xs',
        STATUS_STYLES[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
