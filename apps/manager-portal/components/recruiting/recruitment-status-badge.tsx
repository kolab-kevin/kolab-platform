import { cn } from '@kolab/ui';

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-sky-500/15 text-sky-300',
  CONTACTED: 'bg-indigo-500/15 text-indigo-300',
  INTERESTED: 'bg-emerald-500/15 text-emerald-300',
  APPLICATION: 'bg-violet-500/15 text-violet-300',
  CONTRACT_SENT: 'bg-amber-500/15 text-amber-300',
  SIGNED: 'bg-teal-500/15 text-teal-300',
  ACTIVE_CREATOR: 'bg-emerald-500/15 text-emerald-300',
  INACTIVE: 'bg-muted text-muted-foreground',
  REJECTED: 'bg-red-500/15 text-red-300',
};

export function RecruitmentStatusBadge({ status }: { status: string }) {
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
