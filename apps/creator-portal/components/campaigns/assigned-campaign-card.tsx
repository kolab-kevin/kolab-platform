import { CampaignStatusBadge } from '@/components/common/campaign-status-badge';
import { ProgressBar } from '@/components/common/progress-bar';
import type { AssignedCampaignDisplayModel } from '@/types/campaign-adapters';

type AssignedCampaignCardProps = {
  model: AssignedCampaignDisplayModel;
  selected?: boolean;
  onSelect?: () => void;
};

export function AssignedCampaignCard({ model, selected, onSelect }: AssignedCampaignCardProps) {
  return (
    <article
      className={`border-border/60 rounded-xl border bg-white/[0.02] p-4 transition ${
        selected ? 'border-primary/50 ring-primary/20 ring-1' : ''
      } ${onSelect ? 'cursor-pointer hover:bg-white/[0.04]' : ''}`}
      onClick={onSelect}
      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{model.campaignTitle}</p>
          <p className="text-muted-foreground mt-1 text-xs">{model.brandName ?? 'Unknown brand'}</p>
        </div>
        <CampaignStatusBadge status={model.assignmentStatus} />
      </div>

      {model.progressPercent !== null ? (
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span>{model.progressPercent}%</span>
          </div>
          <ProgressBar percent={model.progressPercent} />
        </div>
      ) : null}

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground text-xs">Campaign status</dt>
          <dd className="font-medium">{model.campaignStatus.replaceAll('_', ' ')}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Priority</dt>
          <dd className="font-medium">{model.priority ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Deliverables</dt>
          <dd className="font-medium">{model.deliverableCount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Starts</dt>
          <dd className="font-medium">
            {model.startsAt ? new Date(model.startsAt).toLocaleDateString() : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Ends</dt>
          <dd className="font-medium">
            {model.endsAt ? new Date(model.endsAt).toLocaleDateString() : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Due</dt>
          <dd className="font-medium">
            {model.dueAt ? new Date(model.dueAt).toLocaleDateString() : '—'}
          </dd>
        </div>
      </dl>
    </article>
  );
}
