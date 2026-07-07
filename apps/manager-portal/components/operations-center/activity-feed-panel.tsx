import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerActivityItem } from '@/types/operations-center';

type ActivityFeedPanelProps = {
  activityFeed: ManagerActivityItem[];
};

const ACTIVITY_LABELS: Record<ManagerActivityItem['activityType'], string> = {
  creator_signed: 'Creator signed',
  campaign_updated: 'Campaign updated',
  live_session_started: 'Live session started',
  goal_completed: 'Goal completed',
  alert_created: 'Alert created',
  other: 'Activity',
};

export function ActivityFeedPanel({ activityFeed }: ActivityFeedPanelProps) {
  return (
    <WorkspaceCard title="Activity feed" description="Chronological manager activity">
      {activityFeed.length === 0 ? (
        <p className="text-muted-foreground text-sm">No recent activity.</p>
      ) : (
        <div className="space-y-3">
          {activityFeed.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{item.title}</span>
                <span className="text-muted-foreground text-xs">
                  {new Date(item.occurredAt).toLocaleString()}
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {ACTIVITY_LABELS[item.activityType]}
                {item.actorLabel ? ` · ${item.actorLabel}` : ''}
              </p>
              {item.description ? (
                <p className="text-muted-foreground mt-1 text-xs">{item.description}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </WorkspaceCard>
  );
}
