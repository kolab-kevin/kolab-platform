import { Button } from '@kolab/ui';

type ErrorWorkspaceStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorWorkspaceState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorWorkspaceStateProps) {
  return (
    <div className="border-destructive/30 bg-destructive/5 rounded-xl border p-6 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-2 text-sm">{message}</p>
      {onRetry ? (
        <Button className="mt-4" variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
