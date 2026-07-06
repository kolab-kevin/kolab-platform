import type { LiveOperationsDataSource } from '@/types/live-operations';
import {
  buildAgencyMonitoring,
  mapCoachQueueItems,
  mapTimelineResponse,
} from '@/types/live-operations-adapters';

import { fetchSessionCoachBundle } from './agency-live-service';
import { fetchSessionTimeline } from './timeline-service';

export async function loadLiveOperationsSessionDetail(
  sessionId: string,
  creatorDisplayName: string,
): Promise<{
  timeline: ReturnType<typeof mapTimelineResponse>;
  coachQueue: ReturnType<typeof mapCoachQueueItems>;
  agencyMonitoring: ReturnType<typeof buildAgencyMonitoring>;
  source: LiveOperationsDataSource;
}> {
  const [timelineResult, coachBundle] = await Promise.all([
    fetchSessionTimeline(sessionId),
    fetchSessionCoachBundle(sessionId),
  ]);

  const timeline = mapTimelineResponse(timelineResult.data);
  const coachQueue = mapCoachQueueItems(
    sessionId,
    creatorDisplayName,
    coachBundle.alerts,
    coachBundle.recommendations,
  );

  const partial = !timelineResult.data || (!coachBundle.alerts && !coachBundle.recommendations);

  return {
    timeline,
    coachQueue,
    agencyMonitoring: buildAgencyMonitoring([], coachQueue, timeline),
    source: partial ? 'partial' : timelineResult.source === 'live' ? 'live' : 'empty',
  };
}
