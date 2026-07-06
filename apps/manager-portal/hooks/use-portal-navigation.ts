'use client';

import { usePathname } from 'next/navigation';

import { buildPortalBreadcrumbs, getNavItemByPathname, PORTAL_NAV_ITEMS } from '@/types/navigation';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function usePortalNavigation() {
  const pathname = usePathname();
  const activeItem = getNavItemByPathname(pathname);
  const breadcrumbs = buildPortalBreadcrumbs(pathname);

  return {
    pathname,
    activeItem,
    navItems: PORTAL_NAV_ITEMS,
    breadcrumbs,
  };
}
