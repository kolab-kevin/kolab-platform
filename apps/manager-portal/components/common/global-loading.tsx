import { cn } from '@kolab/ui';

import { PORTAL_FOCUS_RING_CLASS } from '@/lib/portal-ui';

export function GlobalLoading({ label = 'Loading Manager Portal…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <div
        className={cn(
          'border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent',
          PORTAL_FOCUS_RING_CLASS,
        )}
        aria-hidden
      />
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}

export function LoadingSkeleton({
  rows = 3,
  label = 'Loading content',
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <div
      className="space-y-3 py-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="bg-muted/40 h-16 animate-pulse rounded-xl border border-white/5"
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
