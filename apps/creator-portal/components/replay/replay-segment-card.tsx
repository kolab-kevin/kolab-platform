'use client';

import type { LiveReplaySegment } from '@kolab/types';
import * as React from 'react';

import {
  formatOffsetMs,
  formatReplayLabel,
  getReplayEventLabel,
  getReplaySegmentSummary,
} from '@/types/replay-adapters';

type ReplaySegmentCardProps = {
  segment: LiveReplaySegment;
  index: number;
};

export function ReplaySegmentCard({ segment, index }: ReplaySegmentCardProps) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={() => setExpanded((value) => !value)}
      >
        <div>
          <p className="text-sm font-medium">
            Segment {index + 1} · {formatOffsetMs(segment.startOffsetMs)} –{' '}
            {formatOffsetMs(segment.endOffsetMs)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {segment.dominantEventType
              ? formatReplayLabel(segment.dominantEventType)
              : 'Mixed events'}
            {' · '}
            {getReplaySegmentSummary(segment)}
          </p>
        </div>
        <span className="text-muted-foreground text-xs">{expanded ? 'Hide' : 'Show'} events</span>
      </button>

      {expanded ? (
        <ul className="mt-3 space-y-2 border-t border-white/10 pt-3 text-sm">
          {segment.events.map((event) => (
            <li key={event.id} className="flex justify-between gap-3">
              <span>{getReplayEventLabel(event)}</span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {event.offsetMs !== null ? formatOffsetMs(event.offsetMs) : '—'}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
