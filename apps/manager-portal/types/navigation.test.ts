import { describe, expect, it } from 'vitest';

import {
  buildPortalBreadcrumbs,
  getNavItemByPathname,
  isNavItemActive,
  PORTAL_NAV_ITEMS,
} from '@/types/navigation';

describe('portal navigation', () => {
  it('defines all primary manager portal routes', () => {
    expect(PORTAL_NAV_ITEMS.map((item) => item.label)).toEqual([
      'Dashboard',
      'Creators',
      'Live Operations',
      'Campaigns',
      'Recruiting',
      'Tasks',
      'Reports',
      'Admin',
      'Settings',
    ]);
  });

  it('resolves active nav item by pathname', () => {
    expect(getNavItemByPathname('/portal/live').label).toBe('Live Operations');
    expect(getNavItemByPathname('/portal/settings').label).toBe('Settings');
  });

  it('marks only the matching nav item active', () => {
    const liveItem = PORTAL_NAV_ITEMS.find((item) => item.segment === 'live')!;
    const dashboardItem = PORTAL_NAV_ITEMS.find((item) => item.segment === 'dashboard')!;

    expect(isNavItemActive('/portal/live', liveItem, PORTAL_NAV_ITEMS)).toBe(true);
    expect(isNavItemActive('/portal/live', dashboardItem, PORTAL_NAV_ITEMS)).toBe(false);
  });

  it('builds breadcrumbs with portal root and active section', () => {
    expect(buildPortalBreadcrumbs('/portal/dashboard').map((item) => item.label)).toEqual([
      'Manager Portal',
    ]);
    expect(buildPortalBreadcrumbs('/portal/campaigns').map((item) => item.label)).toEqual([
      'Manager Portal',
      'Campaigns',
    ]);
  });
});
