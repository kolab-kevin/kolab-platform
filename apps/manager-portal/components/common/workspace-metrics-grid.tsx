import { cn } from '@kolab/ui';

import { MetricCard } from '@/components/common/metric-card';
import { PORTAL_METRICS_GRID_CLASS } from '@/lib/portal-ui';

export type WorkspaceMetricItem = {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'flat' | null;
  trendLabel?: string | null;
};

type WorkspaceMetricsGridProps = {
  metrics: WorkspaceMetricItem[];
  columns?: 2 | 3 | 4;
  className?: string;
};

const COLUMN_CLASS: Record<2 | 3 | 4, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 xl:grid-cols-3',
  4: 'sm:grid-cols-2 xl:grid-cols-4',
};

export function WorkspaceMetricsGrid({
  metrics,
  columns = 3,
  className,
}: WorkspaceMetricsGridProps) {
  return (
    <div className={cn(PORTAL_METRICS_GRID_CLASS, COLUMN_CLASS[columns], className)}>
      {metrics.map((metric) => (
        <MetricCard
          key={metric.label}
          label={metric.label}
          value={String(metric.value)}
          trend={metric.trend}
          trendLabel={metric.trendLabel}
        />
      ))}
    </div>
  );
}
