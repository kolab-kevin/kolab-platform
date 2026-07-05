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
