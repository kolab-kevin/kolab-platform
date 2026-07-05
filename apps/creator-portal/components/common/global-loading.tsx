import { cn } from '@kolab/ui';

export function GlobalLoading({ label = 'Loading Creator Studio…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <div
        className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
        aria-hidden
      />
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}

export function InlineLoading({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <GlobalLoading label="Loading…" />
    </div>
  );
}
