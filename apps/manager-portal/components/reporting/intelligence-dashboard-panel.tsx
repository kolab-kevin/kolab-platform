import { cn } from '@kolab/ui';

import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerIntelligenceDashboard } from '@/types/reporting-workspace';

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: 'bg-red-500/15 text-red-300',
  MEDIUM: 'bg-amber-500/15 text-amber-300',
  LOW: 'bg-sky-500/15 text-sky-300',
};

function PriorityLabel({ priority }: { priority: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        PRIORITY_STYLES[priority] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {priority}
    </span>
  );
}

type IntelligenceDashboardPanelProps = {
  intelligence: ManagerIntelligenceDashboard;
};

const SECTIONS: Array<{ key: keyof ManagerIntelligenceDashboard; label: string }> = [
  { key: 'recommendations', label: 'AI recommendations' },
  { key: 'emergingTrends', label: 'Emerging trends' },
  { key: 'organizationRisks', label: 'Organization risks' },
  { key: 'coachingOpportunities', label: 'Coaching opportunities' },
];

export function IntelligenceDashboardPanel({ intelligence }: IntelligenceDashboardPanelProps) {
  return (
    <WorkspaceCard title="Intelligence dashboard" description="Cross-domain insights and risks">
      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <div key={section.key} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <h4 className="mb-3 text-sm font-semibold">{section.label}</h4>
            {intelligence[section.key].length === 0 ? (
              <p className="text-muted-foreground text-xs">No items</p>
            ) : (
              intelligence[section.key].map((item) => (
                <div key={item.id} className="border-b border-white/5 py-2 text-sm last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{item.title}</span>
                    <PriorityLabel priority={item.priority} />
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">{item.summary}</p>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </WorkspaceCard>
  );
}
