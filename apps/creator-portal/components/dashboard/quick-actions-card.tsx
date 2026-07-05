import { Card, CardContent, CardHeader, CardTitle, cn } from '@kolab/ui';

import type { DashboardQuickActionItem } from '@/types/dashboard';

type QuickActionsCardProps = {
  actions: DashboardQuickActionItem[];
};

function priorityClass(priority: DashboardQuickActionItem['priority']): string {
  switch (priority) {
    case 'HIGH':
      return 'border-red-500/30 bg-red-500/10 text-red-100';
    case 'MEDIUM':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
    default:
      return 'border-white/10 bg-white/5 text-foreground';
  }
}

function formatAction(action: DashboardQuickActionItem['action']): string {
  return action.replaceAll('_', ' ');
}

export function QuickActionsCard({ actions }: QuickActionsCardProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No quick actions right now.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {actions.map((item) => (
              <li
                key={`${item.action}-${item.reason}`}
                className={cn('rounded-lg border px-3 py-2', priorityClass(item.priority))}
              >
                <p className="text-sm font-semibold">{formatAction(item.action)}</p>
                <p className="mt-1 text-xs opacity-80">{item.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
