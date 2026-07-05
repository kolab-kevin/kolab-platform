import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import type { DashboardCoach } from '@/types/dashboard';

type CoachCardProps = {
  coach: DashboardCoach;
};

export function CoachCard({ coach }: CoachCardProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Coach</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {coach.activeAlerts.length > 0 ? (
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
              Alerts
            </p>
            <ul className="space-y-2">
              {coach.activeAlerts.map((alert) => (
                <li
                  key={alert.id}
                  className="border-border/60 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2"
                >
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-muted-foreground mt-1 text-xs">{alert.message}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {coach.activeRecommendations.length > 0 ? (
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
              Recommendations
            </p>
            <ul className="space-y-2">
              {coach.activeRecommendations.map((rec) => (
                <li key={rec.id} className="border-border/60 rounded-lg border px-3 py-2">
                  <p className="text-sm font-medium">{rec.title}</p>
                  <p className="text-muted-foreground mt-1 text-xs">{rec.description}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {coach.activeAlerts.length === 0 && coach.activeRecommendations.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active coaching signals.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
