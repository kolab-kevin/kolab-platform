import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerSystemHealth } from '@/types/administration-workspace';

type SystemHealthPanelProps = {
  systemHealth: ManagerSystemHealth;
};

function statusColor(status: ManagerSystemHealth['apiStatus']): string {
  if (status === 'healthy') return 'text-emerald-300';
  if (status === 'degraded') return 'text-amber-300';
  return 'text-muted-foreground';
}

export function SystemHealthPanel({ systemHealth }: SystemHealthPanelProps) {
  const metrics = [
    {
      label: 'API status',
      value: systemHealth.apiStatusLabel,
      status: systemHealth.apiStatus,
    },
    {
      label: 'Queue status',
      value: systemHealth.queueStatusLabel,
      status: systemHealth.queueStatus,
    },
    {
      label: 'Background jobs',
      value: systemHealth.backgroundJobsLabel,
      status: 'unknown' as const,
    },
    {
      label: 'Storage',
      value: systemHealth.storageLabel,
      status: systemHealth.storageStatus,
    },
    {
      label: 'Version',
      value: systemHealth.versionLabel,
      status: 'healthy' as const,
    },
    {
      label: 'Environment',
      value: systemHealth.environmentLabel,
      status: 'healthy' as const,
    },
  ];

  return (
    <WorkspaceCard title="System health" description="Platform status and environment metadata">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3"
          >
            <div className="text-muted-foreground text-xs uppercase tracking-wide">
              {metric.label}
            </div>
            <div className={`mt-1 text-sm font-medium ${statusColor(metric.status)}`}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>
    </WorkspaceCard>
  );
}
