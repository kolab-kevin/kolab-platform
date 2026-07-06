import { WorkspaceCard } from '@/components/common/workspace-layout';
import { PriorityBadge } from '@/components/operations-center/priority-badge';
import type { ManagerAlertCenter } from '@/types/operations-center';

const SECTIONS: Array<{ key: keyof ManagerAlertCenter; label: string }> = [
  { key: 'live', label: 'Live Intelligence' },
  { key: 'coach', label: 'Coach alerts' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'campaign', label: 'Campaign' },
  { key: 'recruiting', label: 'Recruiting' },
];

type AlertCenterPanelProps = {
  alerts: ManagerAlertCenter;
};

export function AlertCenterPanel({ alerts }: AlertCenterPanelProps) {
  return (
    <WorkspaceCard title="Alerts center" description="Aggregated operational alerts">
      <div className="grid gap-4 xl:grid-cols-2">
        {SECTIONS.map((section) => (
          <div key={section.key} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{section.label}</h3>
              <span className="text-muted-foreground text-xs">{alerts[section.key].length}</span>
            </div>
            <div className="space-y-2">
              {alerts[section.key].length === 0 ? (
                <p className="text-muted-foreground text-xs">No alerts</p>
              ) : (
                alerts[section.key].map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-md border border-white/10 bg-white/[0.02] p-2 text-sm"
                  >
                    <div className="font-medium">{alert.title}</div>
                    {alert.entityLabel ? (
                      <p className="text-muted-foreground mt-1 text-xs">{alert.entityLabel}</p>
                    ) : null}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <PriorityBadge priority={alert.priority} />
                      <span className="text-muted-foreground text-xs">
                        {new Date(alert.occurredAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </WorkspaceCard>
  );
}
