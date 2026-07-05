import type { SessionReplayResponse } from '@kolab/types';
import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import { ReplaySegmentCard } from '@/components/replay/replay-segment-card';

type ReplayTimelinePanelProps = {
  replay: SessionReplayResponse | null;
};

export function ReplayTimelinePanel({ replay }: ReplayTimelinePanelProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03] xl:min-h-[560px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Replay Timeline</CardTitle>
        <p className="text-muted-foreground text-xs">
          Timeline navigation only — no video playback
        </p>
      </CardHeader>
      <CardContent>
        {!replay || replay.segments.length === 0 ? (
          <p className="text-muted-foreground text-sm">No replay segments available.</p>
        ) : (
          <ol className="space-y-3">
            {replay.segments.map((segment, index) => (
              <li key={`${segment.startOffsetMs}-${segment.endOffsetMs}`}>
                <ReplaySegmentCard segment={segment} index={index} />
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
