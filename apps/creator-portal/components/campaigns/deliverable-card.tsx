import { DeliverableStatusBadge } from '@/components/common/deliverable-status-badge';
import type { DeliverableDisplayModel } from '@/types/campaign-adapters';

type DeliverableCardProps = {
  model: DeliverableDisplayModel;
};

export function DeliverableCard({ model }: DeliverableCardProps) {
  return (
    <article className="border-border/60 rounded-lg border bg-white/[0.02] px-3 py-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{model.title}</p>
          <p className="text-muted-foreground mt-1 text-xs">{model.campaignTitle}</p>
        </div>
        <DeliverableStatusBadge status={model.status} bucket={model.bucket} />
      </div>
      <p className="text-muted-foreground mt-2 text-xs">
        Due {model.dueAt ? new Date(model.dueAt).toLocaleDateString() : '—'}
      </p>
    </article>
  );
}
