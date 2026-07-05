import { describe, expect, it } from 'vitest';

import { appendSourceToDescription, formatWorkspaceSourceLabel } from '@/lib/workspace-labels';
import {
  buildStudioBreadcrumbs,
  getNavItemByPathname,
  isNavItemActive,
  STUDIO_NAV_ITEMS,
} from '@/types/navigation';

describe('workspace labels', () => {
  it('formats known source labels', () => {
    expect(formatWorkspaceSourceLabel('mock')).toBe('Mock data');
    expect(formatWorkspaceSourceLabel('partial')).toBe('Partial API data');
  });

  it('appends source labels to descriptions', () => {
    expect(appendSourceToDescription('3 goals tracked', 'mock')).toBe(
      '3 goals tracked · Mock data',
    );
  });
});

describe('studio navigation polish', () => {
  it('resolves production breadcrumbs without marking live and production active together', () => {
    const crumbs = buildStudioBreadcrumbs('/studio/live/production');
    expect(crumbs.map((item) => item.label)).toEqual(['Creator Studio', 'Live', 'Production']);
    expect(isNavItemActive('/studio/live/production', STUDIO_NAV_ITEMS[4]!, STUDIO_NAV_ITEMS)).toBe(
      false,
    );
    expect(isNavItemActive('/studio/live/production', STUDIO_NAV_ITEMS[5]!, STUDIO_NAV_ITEMS)).toBe(
      true,
    );
  });

  it('selects the most specific nav item for nested routes', () => {
    expect(getNavItemByPathname('/studio/live/production').label).toBe('Production');
    expect(getNavItemByPathname('/studio/live').label).toBe('Live');
  });
});
