import { WorkspaceCard } from '@/components/common/workspace-layout';
import { PriorityBadge } from '@/components/operations-center/priority-badge';
import type { ManagerDeadlinesSummary } from '@/types/operations-center';

const SECTIONS: Array<{ key: keyof ManagerDeadlinesSummary; label: string }> = [
  { key: 'deliverables', label: 'Deliverables' },
  { key: 'campaigns', label: 'Campaigns' },
  { key: 'contracts', label: 'Contracts' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'documents', label: 'Documents' },
];

type DeadlinesPanelProps = {
  deadlines: ManagerDeadlinesSummary;
};

export function DeadlinesPanel({ deadlines }: DeadlinesPanelProps) {
  return (
    <WorkspaceCard title="Upcoming deadlines" description="Time-sensitive items across domains">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((section) => (
          <div key={section.key} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{section.label}</h3>
              <span className="text-muted-foreground text-xs">{deadlines[section.key].length}</span>
            </div>
            <div className="space-y-2">
              {deadlines[section.key].length === 0 ? (
                <p className="text-muted-foreground text-xs">No deadlines</p>
              ) : (
                deadlines[section.key].map((deadline) => (
                  <div
                    key={deadline.id}
                    className="rounded-md border border-white/10 bg-white/[0.02] p-2 text-sm"
                  >
                    <div className="font-medium">{deadline.title}</div>
                    {deadline.entityLabel ? (
                      <p className="text-muted-foreground mt-1 text-xs">{deadline.entityLabel}</p>
                    ) : null}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <PriorityBadge priority={deadline.priority} />
                      <span className="text-muted-foreground text-xs">
                        {new Date(deadline.dueAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </WorkspaceCard>
  );
}
