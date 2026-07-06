import { cn } from '@kolab/ui';

import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerTimelineEventItem } from '@/types/live-operations';

type TimelinePanelProps = {
  events: ManagerTimelineEventItem[];
  loading?: boolean;
  sessionTitle?: string | null;
};

const CATEGORY_LABELS: Record<ManagerTimelineEventItem['category'], string> = {
  KEY: 'Key event',
  PK: 'PK battle',
  GIFT: 'Gift',
  MILESTONE: 'Milestone',
  OTHER: 'Event',
};

export function TimelinePanel({ events, loading, sessionTitle }: TimelinePanelProps) {
  return (
    <WorkspaceCard
      title="Session timeline"
      description={
        sessionTitle
          ? `Timeline feed for ${sessionTitle}`
          : 'Select a session to view timeline events'
      }
    >
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading timeline…</p>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground text-sm">No timeline events available.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{event.label}</div>
                <span
                  className={cn(
                    'inline-flex rounded-full border border-white/10 px-2 py-0.5 text-xs font-medium',
                  )}
                >
                  {CATEGORY_LABELS[event.category]}
                </span>
              </div>
              {event.detail ? <p className="mt-2 text-sm">{event.detail}</p> : null}
              <div className="text-muted-foreground mt-2 text-xs">
                {new Date(event.occurredAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </WorkspaceCard>
  );
}
