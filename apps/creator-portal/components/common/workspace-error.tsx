import { Button, cn } from '@kolab/ui';

import { WORKSPACE_FOCUS_RING_CLASS } from '@/lib/studio-ui';

type ErrorWorkspaceStateProps = {
  title: string;
  message: string;
  onRetry: () => void;
};

export function ErrorWorkspaceState({ title, message, onRetry }: ErrorWorkspaceStateProps) {
  return (
    <section
      className="border-destructive/30 bg-destructive/10 rounded-xl border p-6 text-center shadow-sm"
      role="alert"
      aria-live="assertive"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-2 text-sm">{message}</p>
      <Button className={cn('mt-4', WORKSPACE_FOCUS_RING_CLASS)} onClick={onRetry}>
        Retry
      </Button>
    </section>
  );
}

export function WorkspaceError(props: ErrorWorkspaceStateProps) {
  return <ErrorWorkspaceState {...props} />;
}
