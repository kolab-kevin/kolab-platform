import { Button } from '@kolab/ui';

const ACTIONS = [
  'View Profile',
  'View Performance',
  'View Intelligence',
  'View Goals',
  'View Campaigns',
  'View Documents',
] as const;

export function CreatorQuickActions() {
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
