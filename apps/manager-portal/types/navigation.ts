export type PortalNavItem = {
  label: string;
  href: string;
  segment: string;
};

export const PORTAL_NAV_ITEMS: PortalNavItem[] = [
  { label: 'Dashboard', href: '/portal/dashboard', segment: 'dashboard' },
  { label: 'Creators', href: '/portal/creators', segment: 'creators' },
  { label: 'Live Operations', href: '/portal/live', segment: 'live' },
  { label: 'Campaigns', href: '/portal/campaigns', segment: 'campaigns' },
  { label: 'Recruiting', href: '/portal/recruiting', segment: 'recruiting' },
  { label: 'Tasks', href: '/portal/tasks', segment: 'tasks' },
  { label: 'Reports', href: '/portal/reports', segment: 'reports' },
  { label: 'Admin', href: '/portal/admin', segment: 'admin' },
  { label: 'Settings', href: '/portal/settings', segment: 'settings' },
];

export function getNavItemByPathname(pathname: string): PortalNavItem {
  const exact = PORTAL_NAV_ITEMS.find((item) => item.href === pathname);
  if (exact) return exact;

  const matches = PORTAL_NAV_ITEMS.filter(
    (item) => pathname.startsWith(`${item.href}/`) || pathname === item.href,
  ).sort((left, right) => right.href.length - left.href.length);

  return matches[0] ?? PORTAL_NAV_ITEMS[0]!;
}

export function isNavItemActive(
  pathname: string,
  item: PortalNavItem,
  items: PortalNavItem[] = PORTAL_NAV_ITEMS,
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

export function buildPortalBreadcrumbs(pathname: string): Array<{ label: string; href?: string }> {
  const crumbs: Array<{ label: string; href?: string }> = [
    { label: 'Manager Portal', href: '/portal/dashboard' },
  ];

  const active = getNavItemByPathname(pathname);
  if (active.segment !== 'dashboard') {
    crumbs.push({ label: active.label });
  }

  return crumbs;
}
