import { Button } from '@kolab/ui';

type WorkspaceErrorProps = {
  title: string;
  message: string;
  onRetry: () => void;
};

export function WorkspaceError({ title, message, onRetry }: WorkspaceErrorProps) {
  return (
    <div className="border-destructive/30 bg-destructive/10 rounded-xl border p-6 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-2 text-sm">{message}</p>
      <Button className="mt-4" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
