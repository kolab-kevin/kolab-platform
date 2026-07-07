import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@kolab/ui', () => ({
  cn: (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' '),
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  useAuth: () => ({
    user: { email: 'manager@example.com' },
    logout: () => undefined,
  }),
}));

vi.mock('@/hooks/use-portal-navigation', () => ({
  usePortalNavigation: () => ({
    navItems: [
      { label: 'Dashboard', href: '/portal/dashboard', segment: 'dashboard' },
      { label: 'Creators', href: '/portal/creators', segment: 'creators' },
    ],
    breadcrumbs: [{ label: 'Manager Portal', href: '/portal/dashboard' }],
  }),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/portal/dashboard',
}));

vi.mock('@/contexts/organization-context', () => ({
  useOrganization: () => ({
    organizations: [{ id: 'org_mock_001', name: 'Kōlab Creator Agency', slug: 'kolab-agency' }],
    activeOrganization: { id: 'org_mock_001', name: 'Kōlab Creator Agency', slug: 'kolab-agency' },
    setActiveOrganizationId: () => undefined,
    managerProfile: {
      id: 'manager_mock_001',
      displayName: 'Manager',
      email: 'manager@example.com',
    },
  }),
}));

vi.mock('@/contexts/portal-preferences-context', () => ({
  usePortalPreferences: () => ({
    preferences: {
      sidebarCollapsed: false,
      theme: 'dark',
      compactWorkspaces: false,
      workspaceViewState: {},
    },
    setSidebarCollapsed: () => undefined,
    setTheme: () => undefined,
    setCompactWorkspaces: () => undefined,
    setWorkspaceViewState: () => undefined,
    getWorkspaceViewState: () => undefined,
  }),
}));

import { PortalShell } from '@/components/layouts/portal-shell';

describe('PortalShell', () => {
  it('renders sidebar, breadcrumbs, and child content', () => {
    const html = renderToStaticMarkup(
      <PortalShell>
        <p>Portal content</p>
      </PortalShell>,
    );

    expect(html).toContain('Manager Portal');
    expect(html).toContain('Dashboard');
    expect(html).toContain('Portal content');
    expect(html).toContain('aria-label="Breadcrumb"');
  });
});
