import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CreatorDetailPanel } from '@/components/creators/creator-detail-panel';
import { createMockCreatorDetail } from '@/services/creator-management-mock';

describe('CreatorDetailPanel', () => {
  it('renders creator detail sections', () => {
    const detail = createMockCreatorDetail('creator_mock_001');
    const html = renderToStaticMarkup(
      <CreatorDetailPanel detail={detail} loading={false} error={null} />,
    );

    expect(html).toContain('Alex Rivera');
    expect(html).toContain('Platform accounts');
    expect(html).toContain('Goals summary');
    expect(html).toContain('Live summary');
    expect(html).toContain('View Profile');
  });
});
