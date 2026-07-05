import { ApplicationCard } from '@/components/campaigns/application-card';
import type { ApplicationBucket, GroupedApplications } from '@/types/campaign-adapters';

const BUCKET_LABELS: Record<ApplicationBucket, string> = {
  draft: 'Draft',
  applied: 'Applied',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

type ApplicationsSectionProps = {
  applications: GroupedApplications;
};

export function ApplicationsSection({ applications }: ApplicationsSectionProps) {
  const total = Object.values(applications).reduce((count, items) => count + items.length, 0);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Applications</h2>
        <span className="text-muted-foreground text-xs">{total} applications</span>
      </div>

      {total === 0 ? (
        <p className="text-muted-foreground border-border/60 rounded-lg border border-dashed px-4 py-6 text-sm">
          No applications to show.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(BUCKET_LABELS) as ApplicationBucket[]).map((bucket) => (
            <div key={bucket} className="space-y-2">
              <h3 className="text-sm font-semibold">{BUCKET_LABELS[bucket]}</h3>
              {applications[bucket].length === 0 ? (
                <p className="text-muted-foreground text-xs">None</p>
              ) : (
                <ul className="space-y-2">
                  {applications[bucket].map((item) => (
                    <li key={item.id}>
                      <ApplicationCard model={item} />
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
