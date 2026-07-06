import { Button } from '@kolab/ui';

const ACTIONS = [
  'Open Creator',
  'Open Replay',
  'Open Campaign',
  'Message Creator',
  'Escalate',
  'View Intelligence',
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
