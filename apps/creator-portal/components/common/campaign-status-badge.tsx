import type {
  CampaignApplicationStatus,
  CampaignAssignmentStatus,
  CampaignCreatorDeliverableStatus,
  CampaignStatus,
} from '@kolab/types';
import { cn } from '@kolab/ui';

import { formatCampaignStatus } from '@/types/campaign-adapters';

type CampaignStatusBadgeProps = {
  status:
    | CampaignStatus
    | CampaignAssignmentStatus
    | CampaignCreatorDeliverableStatus
    | CampaignApplicationStatus
    | string;
  className?: string;
};

function statusClass(status: string): string {
  switch (status) {
    case 'ACTIVE':
    case 'IN_PROGRESS':
    case 'ACCEPTED':
    case 'APPROVED':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
    case 'ASSIGNED':
    case 'APPLIED':
    case 'SUBMITTED':
    case 'INVITED':
      return 'border-primary/30 bg-primary/10 text-primary';
    case 'REJECTED':
    case 'CANCELLED':
    case 'MISSED':
      return 'border-red-500/30 bg-red-500/10 text-red-200';
    case 'PAUSED':
    case 'DRAFT':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
    default:
      return 'border-white/10 bg-white/5 text-muted-foreground';
  }
}

export function CampaignStatusBadge({ status, className }: CampaignStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide',
        statusClass(status),
        className,
      )}
    >
      {formatCampaignStatus(status)}
    </span>
  );
}
