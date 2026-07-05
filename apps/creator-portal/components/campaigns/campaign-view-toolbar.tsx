import { Button } from '@kolab/ui';

import type { CampaignWorkspaceView } from '@/types/campaign-adapters';

type CampaignViewToolbarProps = {
  view: CampaignWorkspaceView;
  onViewChange: (view: CampaignWorkspaceView) => void;
};

export function CampaignViewToolbar({ view, onViewChange }: CampaignViewToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={view === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewChange('list')}
        >
          List
        </Button>
        <Button
          variant={view === 'kanban' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewChange('kanban')}
        >
          Kanban
        </Button>
        <Button variant="outline" size="sm" disabled title="Coming soon">
          Calendar
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled title="Coming soon">
          Filter
        </Button>
        <Button variant="outline" size="sm" disabled title="Coming soon">
          Search
        </Button>
      </div>
    </div>
  );
}
