import type { CampaignApplicationStatus } from '@kolab/types';

import { CampaignStatusBadge } from '@/components/common/campaign-status-badge';
import type { ApplicationBucket } from '@/types/campaign-adapters';

type ApplicationStatusBadgeProps = {
  status: CampaignApplicationStatus;
  bucket?: ApplicationBucket;
  className?: string;
};

export function ApplicationStatusBadge({ status, bucket, className }: ApplicationStatusBadgeProps) {
  if (bucket) {
    return (
      <span className="text-muted-foreground inline-flex rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium uppercase tracking-wide">
        {bucket}
      </span>
    );
  }

  return <CampaignStatusBadge status={status} className={className} />;
}
