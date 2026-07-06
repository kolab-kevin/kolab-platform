import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerCoachQueueItem } from '@/types/live-operations';

type CoachQueuePanelProps = {
  items: ManagerCoachQueueItem[];
};

export function CoachQueuePanel({ items }: CoachQueuePanelProps) {
  const reviewItems = items.filter((item) => item.needsReview);

  return (
    <WorkspaceCard
      title="Coach queue"
      description="High-priority coaching signals needing manager review"
    >
      {reviewItems.length === 0 ? (
        <p className="text-muted-foreground text-sm">No coaching items need review.</p>
      ) : (
        <div className="space-y-3">
          {reviewItems.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{item.title}</div>
                <div className="text-muted-foreground text-xs">
                  {item.priority} · {item.kind}
                </div>
              </div>
              <div className="text-muted-foreground mt-1 text-sm">{item.creatorDisplayName}</div>
              <p className="mt-2 text-sm">{item.summary}</p>
              {item.recommendedAction ? (
                <p className="text-muted-foreground mt-2 text-sm">
                  Recommended: {item.recommendedAction}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </WorkspaceCard>
  );
}
