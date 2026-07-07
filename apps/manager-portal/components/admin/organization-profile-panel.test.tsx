import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { OrganizationProfilePanel } from '@/components/admin/organization-profile-panel';
import { createMockAdministrationWorkspace } from '@/services/administration-mock';

describe('OrganizationProfilePanel', () => {
  it('renders organization profile details', () => {
    const workspace = createMockAdministrationWorkspace('org_mock_001');
    const html = renderToStaticMarkup(
      <OrganizationProfilePanel profile={workspace.organizationProfile} />,
    );

    expect(html).toContain('Organization profile');
    expect(html).toContain('Kolab Talent Agency');
    expect(html).toContain('Team members');
  });
});
