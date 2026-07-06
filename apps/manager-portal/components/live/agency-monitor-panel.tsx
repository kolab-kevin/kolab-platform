import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerAgencyMonitoring } from '@/types/live-operations';

type AgencyMonitorPanelProps = {
  monitoring: ManagerAgencyMonitoring;
};

export function AgencyMonitorPanel({ monitoring }: AgencyMonitorPanelProps) {
  const metrics = [
    { label: 'Creators live', value: monitoring.creatorsLiveNow },
    { label: 'Open alerts', value: monitoring.openAlerts },
    { label: 'Viewer spikes', value: monitoring.viewerSpikes },
    { label: 'Gift spikes', value: monitoring.giftSpikes },
    { label: 'Connection issues', value: monitoring.connectionIssues },
    { label: 'Stream quality', value: monitoring.streamQualityIssues },
  ];

  return (
    <WorkspaceCard title="Agency monitoring" description="Portfolio-wide live signals">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3"
          >
            <div className="text-muted-foreground text-xs uppercase tracking-wide">
              {metric.label}
            </div>
            <div className="mt-1 text-2xl font-semibold">{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <h3 className="text-sm font-semibold">Current creators live</h3>
        {monitoring.liveCreators.length === 0 ? (
          <p className="text-muted-foreground text-sm">No creators are live right now.</p>
        ) : (
          monitoring.liveCreators.map((creator) => (
            <div
              key={creator.sessionId}
              className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2"
            >
              <div className="font-medium">{creator.creatorDisplayName}</div>
              <div className="text-muted-foreground text-sm">
                {creator.title} · {creator.platform}
                {creator.viewerCount != null ? ` · ${creator.viewerCount} viewers` : ''}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 space-y-3">
        <h3 className="text-sm font-semibold">Alerts</h3>
        {monitoring.alerts.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active alerts.</p>
        ) : (
          monitoring.alerts.slice(0, 5).map((alert) => (
            <div
              key={alert.id}
              className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{alert.title}</span>
                <span className="text-muted-foreground text-xs">{alert.priority}</span>
              </div>
              <div className="text-muted-foreground mt-1 text-sm">
                {alert.creatorDisplayName} · {alert.message}
              </div>
            </div>
          ))
        )}
      </div>
    </WorkspaceCard>
  );
}
