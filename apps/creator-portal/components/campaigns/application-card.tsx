import { ApplicationStatusBadge } from '@/components/common/application-status-badge';
import type { ApplicationDisplayModel } from '@/types/campaign-adapters';

type ApplicationCardProps = {
  model: ApplicationDisplayModel;
};

export function ApplicationCard({ model }: ApplicationCardProps) {
  return (
    <article className="border-border/60 rounded-lg border bg-white/[0.02] px-3 py-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{model.campaignTitle}</p>
          <p className="text-muted-foreground mt-1 text-xs">{model.brandName ?? 'Unknown brand'}</p>
        </div>
        <ApplicationStatusBadge status={model.status} bucket={model.bucket} />
      </div>
      <p className="text-muted-foreground mt-2 text-xs">
        Due {model.dueAt ? new Date(model.dueAt).toLocaleDateString() : '—'}
      </p>
    </article>
  );
}
