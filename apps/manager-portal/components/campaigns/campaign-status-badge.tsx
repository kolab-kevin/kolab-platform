import { cn } from '@kolab/ui';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  ACTIVE: 'bg-emerald-500/15 text-emerald-300',
  PAUSED: 'bg-amber-500/15 text-amber-300',
  COMPLETED: 'bg-sky-500/15 text-sky-300',
  CANCELLED: 'bg-red-500/15 text-red-300',
  ARCHIVED: 'bg-muted text-muted-foreground',
};

export function CampaignStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {status.replaceAll('_', ' ')}
    </span>
  );
}
