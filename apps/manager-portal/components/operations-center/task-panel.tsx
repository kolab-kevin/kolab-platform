import { WorkspaceCard } from '@/components/common/workspace-layout';
import { PriorityBadge } from '@/components/operations-center/priority-badge';
import type { ManagerTasksSummary } from '@/types/operations-center';

const COLUMNS: Array<{ key: keyof ManagerTasksSummary; label: string }> = [
  { key: 'assigned', label: 'Assigned' },
  { key: 'inProgress', label: 'In Progress' },
  { key: 'waiting', label: 'Waiting' },
  { key: 'completed', label: 'Completed' },
];

type TaskPanelProps = {
  tasks: ManagerTasksSummary;
};

export function TaskPanel({ tasks }: TaskPanelProps) {
  return (
    <WorkspaceCard title="My tasks" description="Manager task queue by status">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((column) => (
          <div key={column.key} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{column.label}</h3>
              <span className="text-muted-foreground text-xs">{tasks[column.key].length}</span>
            </div>
            <div className="space-y-2">
              {tasks[column.key].length === 0 ? (
                <p className="text-muted-foreground text-xs">No tasks</p>
              ) : (
                tasks[column.key].map((task) => (
                  <div
                    key={task.id}
                    className="rounded-md border border-white/10 bg-white/[0.02] p-2 text-sm"
                  >
                    <div className="font-medium">{task.title}</div>
                    {task.description ? (
                      <p className="text-muted-foreground mt-1 text-xs">{task.description}</p>
                    ) : null}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <PriorityBadge priority={task.priority} />
                      <span className="text-muted-foreground text-xs">{task.sourceLabel}</span>
                    </div>
                    {task.dueAt ? (
                      <p className="text-muted-foreground mt-1 text-xs">
                        Due {new Date(task.dueAt).toLocaleString()}
                      </p>
                    ) : null}
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
