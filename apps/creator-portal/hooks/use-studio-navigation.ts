'use client';

import { usePathname } from 'next/navigation';

import { buildStudioBreadcrumbs, getNavItemByPathname, STUDIO_NAV_ITEMS } from '@/types/navigation';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function useStudioNavigation() {
  const pathname = usePathname();
  const activeItem = getNavItemByPathname(pathname);
  const breadcrumbs = buildStudioBreadcrumbs(pathname);

  return {
    pathname,
    activeItem,
    navItems: STUDIO_NAV_ITEMS,
    breadcrumbs,
  };
}
