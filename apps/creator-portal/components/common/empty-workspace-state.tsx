import { cn } from '@kolab/ui';

type EmptyWorkspaceStateProps = {
  title?: string;
  message: string;
  className?: string;
};

export function EmptyWorkspaceState({
  title = 'Nothing here yet',
  message,
  className,
}: EmptyWorkspaceStateProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 shadow-sm',
        className,
      )}
      role="status"
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-amber-100/90">{message}</p>
    </div>
  );
}

export function PartialWorkspaceNotice({ message }: { message: string }) {
  return (
    <EmptyWorkspaceState
      title="Partial data loaded"
      message={message}
      className="border-amber-500/30"
    />
  );
}
