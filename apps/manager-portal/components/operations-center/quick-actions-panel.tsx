import { Button } from '@kolab/ui';

const ACTIONS = [
  'Create Task',
  'Assign Task',
  'Open Creator',
  'Open Campaign',
  'Acknowledge Alert',
  'Export',
] as const;

export function QuickActionsPanel() {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map((action) => (
        <Button key={action} variant="outline" size="sm" type="button" disabled>
          {action}
        </Button>
      ))}
    </div>
  );
}
