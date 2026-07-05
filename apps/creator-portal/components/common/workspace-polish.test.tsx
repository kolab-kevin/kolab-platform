import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { EmptyWorkspaceState } from '@/components/common/empty-workspace-state';
import { WorkspaceCard } from '@/components/common/workspace-layout';
import { LoadingSkeleton } from '@/components/common/workspace-loading';
import { WorkspaceHeader } from '@/components/common/workspace-page';

describe('shared workspace components', () => {
  it('renders workspace header with title', () => {
    const html = renderToStaticMarkup(
      <WorkspaceHeader title="Goals" description="3 goals tracked" source="mock" />,
    );
    expect(html).toContain('Goals');
    expect(html).toContain('3 goals tracked');
  });

  it('renders empty workspace state with status role', () => {
    const html = renderToStaticMarkup(<EmptyWorkspaceState message="No goals are assigned yet." />);
    expect(html).toContain('Nothing here yet');
    expect(html).toContain('role="status"');
  });

  it('renders loading skeleton with aria-busy', () => {
    const html = renderToStaticMarkup(<LoadingSkeleton rows={2} />);
    expect(html).toContain('aria-busy="true"');
  });

  it('renders standardized workspace card', () => {
    const html = renderToStaticMarkup(
      <WorkspaceCard title="Highlights" description="Session highlights">
        Content
      </WorkspaceCard>,
    );
    expect(html).toContain('Highlights');
    expect(html).toContain('Session highlights');
  });
});
