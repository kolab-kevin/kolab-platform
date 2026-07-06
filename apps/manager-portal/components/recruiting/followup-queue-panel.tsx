import { WorkspaceCard } from '@/components/common/workspace-layout';
import { RecruitmentStatusBadge } from '@/components/recruiting/recruitment-status-badge';
import type { ManagerFollowUpQueue } from '@/types/recruiting-workspace';

type FollowUpQueuePanelProps = {
  followUpQueue: ManagerFollowUpQueue;
};

const SECTIONS: Array<{ key: keyof ManagerFollowUpQueue; label: string }> = [
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
];

export function FollowUpQueuePanel({ followUpQueue }: FollowUpQueuePanelProps) {
  return (
    <WorkspaceCard title="Follow-up queue" description="Scheduled outreach by urgency">
      <div className="grid gap-4 md:grid-cols-3">
        {SECTIONS.map((section) => (
          <div key={section.key} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{section.label}</h3>
              <span className="text-muted-foreground text-xs">
                {followUpQueue[section.key].length}
              </span>
            </div>
            <div className="space-y-2">
              {followUpQueue[section.key].length === 0 ? (
                <p className="text-muted-foreground text-xs">No follow-ups</p>
              ) : (
                followUpQueue[section.key].map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-white/10 bg-white/[0.02] p-2 text-sm"
                  >
                    <div className="font-medium">{item.prospectName}</div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      {item.assignedRecruiterName ?? 'Unassigned'} ·{' '}
                      {new Date(item.nextFollowUpAt).toLocaleString()}
                    </div>
                    <div className="mt-2">
                      <RecruitmentStatusBadge status={item.status} />
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
