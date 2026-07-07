import { Button } from '@kolab/ui';

type WorkspaceRefreshButtonProps = {
  onRefresh: () => void;
  label?: string;
};

export function WorkspaceRefreshButton({
  onRefresh,
  label = 'Refresh',
}: WorkspaceRefreshButtonProps) {
  return (
    <Button variant="outline" size="sm" type="button" onClick={() => void onRefresh()}>
      {label}
    </Button>
  );
}

type QuickAction = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
};

type QuickActionsBarProps = {
  actions: QuickAction[];
};

export function QuickActionsBar({ actions }: QuickActionsBarProps) {
  return (
    <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Quick actions">
      {actions.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          size="sm"
          type="button"
          disabled={action.disabled ?? !action.onClick}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
