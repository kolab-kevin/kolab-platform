import { Button } from '@kolab/ui';

const ACTIONS = [
  'Add Prospect',
  'Assign Recruiter',
  'Schedule Follow-up',
  'Send Message',
  'Convert to Creator',
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
