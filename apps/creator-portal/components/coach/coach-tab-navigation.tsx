import { Button } from '@kolab/ui';

import { WORKSPACE_FOCUS_RING_CLASS } from '@/lib/studio-ui';
import type { CoachWorkspaceView } from '@/types/coach-adapters';

type CoachTabNavigationProps = {
  view: CoachWorkspaceView;
  onViewChange: (view: CoachWorkspaceView) => void;
};

const TABS: Array<{ id: CoachWorkspaceView; label: string }> = [
  { id: 'summary', label: 'Summary' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'intelligence', label: 'Intelligence' },
];

export function CoachTabNavigation({ view, onViewChange }: CoachTabNavigationProps) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Coach workspace views">
      {TABS.map((tab) => (
        <Button
          key={tab.id}
          role="tab"
          aria-selected={view === tab.id}
          variant={view === tab.id ? 'default' : 'outline'}
          size="sm"
          className={WORKSPACE_FOCUS_RING_CLASS}
          onClick={() => onViewChange(tab.id)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}
