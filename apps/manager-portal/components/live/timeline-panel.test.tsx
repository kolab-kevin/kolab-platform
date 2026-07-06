import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { TimelinePanel } from '@/components/live/timeline-panel';
import { createMockLiveOperationsWorkspace } from '@/services/live-operations-mock';

describe('TimelinePanel', () => {
  it('renders timeline events', () => {
    const workspace = createMockLiveOperationsWorkspace('org_mock_001');
    const html = renderToStaticMarkup(
      <TimelinePanel events={workspace.timeline} sessionTitle="Friday Night Live" />,
    );

    expect(html).toContain('Session timeline');
    expect(html).toContain('Gift Received');
    expect(html).toContain('Pk Started');
  });
});
