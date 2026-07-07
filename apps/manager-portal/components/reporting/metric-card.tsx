import { TrendIndicator } from '@/components/reporting/trend-indicator';

type MetricCardProps = {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'flat' | null;
  trendLabel?: string | null;
};

export function MetricCard({ label, value, trend = null, trendLabel = null }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3">
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
