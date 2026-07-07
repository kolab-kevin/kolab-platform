import { cn } from '@kolab/ui';

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: 'bg-red-500/15 text-red-300',
  MEDIUM: 'bg-amber-500/15 text-amber-300',
  LOW: 'bg-sky-500/15 text-sky-300',
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        PRIORITY_STYLES[priority] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {priority}
    </span>
  );
}
