import type { CampaignCreatorDeliverableStatus } from '@kolab/types';
import { cn } from '@kolab/ui';

import { CampaignStatusBadge } from '@/components/common/campaign-status-badge';
import type { DeliverableBucket } from '@/types/campaign-adapters';

type DeliverableStatusBadgeProps = {
  status: CampaignCreatorDeliverableStatus;
  bucket?: DeliverableBucket;
  className?: string;
};

function bucketClass(bucket: DeliverableBucket): string {
  switch (bucket) {
    case 'overdue':
      return 'border-red-500/30 bg-red-500/10 text-red-200';
    case 'approved':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
    case 'rejected':
      return 'border-red-500/30 bg-red-500/10 text-red-200';
    case 'submitted':
      return 'border-primary/30 bg-primary/10 text-primary';
    default:
      return 'border-white/10 bg-white/5 text-muted-foreground';
  }
}

export function DeliverableStatusBadge({ status, bucket, className }: DeliverableStatusBadgeProps) {
  if (bucket) {
    return (
      <span
        className={cn(
          'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide',
          bucketClass(bucket),
          className,
        )}
      >
        {bucket}
      </span>
    );
  }

  return <CampaignStatusBadge status={status} className={className} />;
}
