import { DeliverableCard } from '@/components/campaigns/deliverable-card';
import type { DeliverableBucket, GroupedDeliverables } from '@/types/campaign-adapters';

const BUCKET_LABELS: Record<DeliverableBucket, string> = {
  pending: 'Pending',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  overdue: 'Overdue',
};

type DeliverablesSectionProps = {
  deliverables: GroupedDeliverables;
};

export function DeliverablesSection({ deliverables }: DeliverablesSectionProps) {
  const total = Object.values(deliverables).reduce((count, items) => count + items.length, 0);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Deliverables</h2>
        <span className="text-muted-foreground text-xs">{total} deliverables</span>
      </div>

      {total === 0 ? (
        <p className="text-muted-foreground border-border/60 rounded-lg border border-dashed px-4 py-6 text-sm">
          No deliverables to show.
        </p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {(Object.keys(BUCKET_LABELS) as DeliverableBucket[]).map((bucket) => (
            <div key={bucket} className="space-y-2">
              <h3 className="text-sm font-semibold">{BUCKET_LABELS[bucket]}</h3>
              {deliverables[bucket].length === 0 ? (
                <p className="text-muted-foreground text-xs">None</p>
              ) : (
                <ul className="space-y-2">
                  {deliverables[bucket].map((item) => (
                    <li key={item.id}>
                      <DeliverableCard model={item} />
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
