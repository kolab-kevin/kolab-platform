import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { OperationsOverviewPanel } from '@/components/operations-center/operations-overview-panel';
import { createMockOperationsCenterWorkspace } from '@/services/operations-mock';

describe('OperationsOverviewPanel', () => {
  it('renders operations overview metrics', () => {
    const workspace = createMockOperationsCenterWorkspace('org_mock_001');
    const html = renderToStaticMarkup(<OperationsOverviewPanel overview={workspace.overview} />);

    expect(html).toContain('Operations overview');
    expect(html).toContain('Open tasks');
    expect(html).toContain('Critical alerts');
  });
});
