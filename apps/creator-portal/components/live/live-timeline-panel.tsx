import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import type { TimelineEventDisplayModel } from '@/types/live-adapters';
import { formatLiveLabel } from '@/types/live-adapters';

type LiveTimelinePanelProps = {
  events: TimelineEventDisplayModel[];
  nextCursor: string | null;
};

export function LiveTimelinePanel({ events, nextCursor }: LiveTimelinePanelProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03] lg:min-h-[520px] lg:resize-x lg:overflow-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Live Timeline</CardTitle>
        <p className="text-muted-foreground text-xs">Read-only chronological session events</p>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm">No timeline events available.</p>
        ) : (
          <ol className="relative space-y-4 border-l border-white/10 pl-4">
            {events.map((item) => (
              <li key={item.event.id} className="relative">
                <span className="bg-primary absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full" />
                <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{item.label}</p>
                    <span className="text-muted-foreground text-xs">{item.category}</span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatLiveLabel(item.event.eventType)}
                    {item.event.offsetMs !== null
                      ? ` · ${Math.round(item.event.offsetMs / 60000)}m`
                      : ''}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {new Date(item.event.occurredAt).toLocaleTimeString()}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
        {nextCursor ? (
          <p className="text-muted-foreground mt-4 text-xs">
            Additional timeline events are available — pagination will load more in a future update.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
