import { Button } from '@kolab/ui';

import { ConfidenceIndicator } from '@/components/common/confidence-indicator';
import { PriorityBadge } from '@/components/common/priority-badge';
import type { AlertDisplayModel } from '@/types/coach-adapters';
import { formatCoachLabel } from '@/types/coach-adapters';

type AlertCardProps = {
  alert: AlertDisplayModel;
};

export function AlertCard({ alert }: AlertCardProps) {
  return (
    <article className="border-border/60 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{alert.title}</p>
          <p className="text-muted-foreground mt-1 text-xs">{formatCoachLabel(alert.alertType)}</p>
        </div>
        <PriorityBadge priority={alert.priority} />
      </div>
      <p className="text-sm leading-relaxed">{alert.message}</p>
      <p className="mt-3 text-sm">
        <span className="text-muted-foreground text-xs uppercase tracking-wide">
          Recommended action
        </span>
        <span className="mt-1 block">{alert.recommendedAction}</span>
      </p>
      {alert.relatedRecommendationId ? (
        <p className="text-muted-foreground mt-2 text-xs">
          Related recommendation: {alert.relatedRecommendationId}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <ConfidenceIndicator score={alert.confidenceScore} />
        <span className="text-muted-foreground text-xs">
          {new Date(alert.generatedAt).toLocaleString()}
        </span>
      </div>
      <Button variant="ghost" size="sm" className="mt-3" disabled title="Coming soon">
        Dismiss
      </Button>
    </article>
  );
}
