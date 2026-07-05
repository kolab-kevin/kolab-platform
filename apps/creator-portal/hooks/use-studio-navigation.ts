'use client';

import { usePathname } from 'next/navigation';

import { getNavItemBySegment, STUDIO_NAV_ITEMS } from '@/types/navigation';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function useStudioNavigation() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const studioSegment = segments[1] ?? 'dashboard';
  const activeItem = getNavItemBySegment(studioSegment) ?? STUDIO_NAV_ITEMS[0]!;

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Creator Studio', href: '/studio/dashboard' },
    { label: activeItem.label },
  ];

  return {
    pathname,
    activeItem,
    navItems: STUDIO_NAV_ITEMS,
    breadcrumbs,
  };
}
