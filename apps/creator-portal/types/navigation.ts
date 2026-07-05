export type StudioNavItem = {
  label: string;
  href: string;
  segment: string;
};

export const STUDIO_NAV_ITEMS: StudioNavItem[] = [
  { label: 'Dashboard', href: '/studio/dashboard', segment: 'dashboard' },
  { label: 'Goals', href: '/studio/goals', segment: 'goals' },
  { label: 'Campaigns', href: '/studio/campaigns', segment: 'campaigns' },
  { label: 'Deliverables', href: '/studio/deliverables', segment: 'deliverables' },
  { label: 'Live', href: '/studio/live', segment: 'live' },
  { label: 'Production', href: '/studio/live/production', segment: 'production' },
  { label: 'Coach', href: '/studio/coach', segment: 'coach' },
  { label: 'Performance', href: '/studio/performance', segment: 'performance' },
  { label: 'Intelligence', href: '/studio/intelligence', segment: 'intelligence' },
  { label: 'Profile', href: '/studio/profile', segment: 'profile' },
  { label: 'Settings', href: '/studio/settings', segment: 'settings' },
];

export function getNavItemBySegment(segment: string): StudioNavItem | undefined {
  return STUDIO_NAV_ITEMS.find((item) => item.segment === segment);
}

export function getNavItemByPathname(pathname: string): StudioNavItem {
  const exact = STUDIO_NAV_ITEMS.find((item) => item.href === pathname);
  if (exact) return exact;

  const matches = STUDIO_NAV_ITEMS.filter(
    (item) => pathname.startsWith(`${item.href}/`) || pathname === item.href,
  ).sort((left, right) => right.href.length - left.href.length);

  return matches[0] ?? STUDIO_NAV_ITEMS[0]!;
}

export function isNavItemActive(
  pathname: string,
  item: StudioNavItem,
  items: StudioNavItem[] = STUDIO_NAV_ITEMS,
): boolean {
  if (pathname === item.href) return true;
  if (!pathname.startsWith(`${item.href}/`)) return false;

  return !items.some(
    (other) =>
      other.href !== item.href &&
      other.href.startsWith(`${item.href}/`) &&
      (pathname === other.href || pathname.startsWith(`${other.href}/`)),
  );
}

export function buildStudioBreadcrumbs(pathname: string): Array<{ label: string; href?: string }> {
  const crumbs: Array<{ label: string; href?: string }> = [
    { label: 'Creator Studio', href: '/studio/dashboard' },
  ];

  if (pathname.startsWith('/studio/live/production')) {
    crumbs.push({ label: 'Live', href: '/studio/live' });
    crumbs.push({ label: 'Production' });
    return crumbs;
  }

  const active = getNavItemByPathname(pathname);
  crumbs.push({ label: active.label });
  return crumbs;
}
