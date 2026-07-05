import { cn } from '@kolab/ui';

import { WORKSPACE_FOCUS_RING_CLASS } from '@/lib/studio-ui';

type LoadingSkeletonProps = {
  rows?: number;
  className?: string;
  label?: string;
};

export function LoadingSkeleton({
  rows = 3,
  className,
  label = 'Loading workspace content',
}: LoadingSkeletonProps) {
  return (
    <div
      className={cn('space-y-3 py-6', className)}
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

export function WorkspaceLoadingState({
  label = 'Loading…',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('py-8', className)}>
      <LoadingSkeleton rows={4} label={label} />
    </div>
  );
}

export function InlineLoading({
  className,
  label = 'Loading…',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <WorkspaceLoadingState label={label} />
    </div>
  );
}

export function GlobalLoading({ label = 'Loading Creator Studio…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <div
        className={cn(
          'border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent',
          WORKSPACE_FOCUS_RING_CLASS,
        )}
        aria-hidden
      />
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}
