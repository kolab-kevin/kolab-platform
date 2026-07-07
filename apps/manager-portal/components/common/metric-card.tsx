import { TrendIndicator } from '@/components/common/trend-indicator';
import { PORTAL_INNER_TILE_CLASS } from '@/lib/portal-ui';

type MetricCardProps = {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'flat' | null;
  trendLabel?: string | null;
};

export function MetricCard({ label, value, trend = null, trendLabel = null }: MetricCardProps) {
  return (
    <div className={PORTAL_INNER_TILE_CLASS}>
      <div className="text-muted-foreground text-xs uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
      {trend ? (
        <div className="mt-2">
          <TrendIndicator trend={trend} label={trendLabel} />
        </div>
      ) : null}
    </div>
  );
}
