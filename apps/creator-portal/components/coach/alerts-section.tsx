import type { LiveCoachAlertPriority } from '@kolab/types';

import { AlertCard } from '@/components/coach/alert-card';
import type { GroupedAlerts } from '@/types/coach-adapters';

const PRIORITY_LABELS: Record<LiveCoachAlertPriority, string> = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

type AlertsSectionProps = {
  alerts: GroupedAlerts;
};

export function AlertsSection({ alerts }: AlertsSectionProps) {
  const total = Object.values(alerts).reduce((count, items) => count + items.length, 0);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Coach Alerts</h2>
        <span className="text-muted-foreground text-xs">{total} alerts</span>
      </div>

      {total === 0 ? (
        <p className="text-muted-foreground border-border/60 rounded-lg border border-dashed px-4 py-6 text-sm">
          No coach alerts right now.
        </p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {(Object.keys(PRIORITY_LABELS) as LiveCoachAlertPriority[]).map((priority) => (
            <div key={priority} className="space-y-2">
              <h3 className="text-sm font-semibold">{PRIORITY_LABELS[priority]}</h3>
              {alerts[priority].length === 0 ? (
                <p className="text-muted-foreground text-xs">None</p>
              ) : (
                <ul className="space-y-2">
                  {alerts[priority].map((item) => (
                    <li key={item.id}>
                      <AlertCard alert={item} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
