import { cn } from '@kolab/ui';

type TrendIndicatorProps = {
  trend: 'up' | 'down' | 'flat' | null;
  label?: string | null;
};

const TREND_STYLES: Record<'up' | 'down' | 'flat', string> = {
  up: 'text-emerald-300',
  down: 'text-red-300',
  flat: 'text-muted-foreground',
};

export function TrendIndicator({ trend, label }: TrendIndicatorProps) {
  if (!trend) return null;

  const symbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <span className={cn('text-xs font-medium', TREND_STYLES[trend])}>
      {symbol}
      {label ? ` ${label}` : ''}
    </span>
  );
}
