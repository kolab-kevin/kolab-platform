import { Button } from '@kolab/ui';

const ACTIONS = [
  'Create Campaign',
  'View Campaign',
  'Assign Creator',
  'View Deliverables',
  'Export',
] as const;

export function CampaignQuickActions() {
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
