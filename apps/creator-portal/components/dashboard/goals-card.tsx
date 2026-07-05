import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import type { DashboardTodaysGoals } from '@/types/dashboard';

type GoalsCardProps = {
  goals: DashboardTodaysGoals;
};

export function GoalsCard({ goals }: GoalsCardProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Goals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>{goals.activeGoals.length} active</span>
          <span>{goals.completedToday} completed today</span>
        </div>
        {goals.activeGoals.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active goals for today.</p>
        ) : (
          <ul className="space-y-3">
            {goals.activeGoals.map((goal) => (
              <li key={goal.id}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{goal.title ?? goal.goalType}</span>
                  <span className="text-muted-foreground">{goal.progressPercent}%</span>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${goal.progressPercent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
