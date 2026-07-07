import { Button } from '@kolab/ui';

const ACTIONS = [
  'Invite User',
  'Create Role',
  'Edit Organization',
  'Export Audit',
  'Refresh Status',
] as const;

type QuickActionsPanelProps = {
  onRefresh?: () => void;
};

export function QuickActionsPanel({ onRefresh }: QuickActionsPanelProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map((action) => (
        <Button
          key={action}
          variant="outline"
          size="sm"
          type="button"
          disabled={action !== 'Refresh Status'}
          onClick={action === 'Refresh Status' ? onRefresh : undefined}
        >
          {action}
        </Button>
      ))}
    </div>
  );
}
