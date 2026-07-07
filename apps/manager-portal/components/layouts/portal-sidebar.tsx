'use client';

import { cn } from '@kolab/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import { PORTAL_FOCUS_RING_CLASS } from '@/lib/portal-ui';
import { isNavItemActive, type PortalNavItem } from '@/types/navigation';

type PortalSidebarProps = {
  items: PortalNavItem[];
  mobileOpen: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function PortalSidebar({
  items,
  mobileOpen,
  collapsed = false,
  onNavigate,
}: PortalSidebarProps) {
  const pathname = usePathname();
  const linkRefs = React.useRef<Array<HTMLAnchorElement | null>>([]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>, index: number) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();

    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = (index + direction + items.length) % items.length;
    linkRefs.current[nextIndex]?.focus();
  };

  return (
    <>
      <div
        className={cn(
          'bg-card/30 fixed inset-0 z-40 backdrop-blur-sm lg:hidden',
          mobileOpen ? 'block' : 'hidden',
        )}
        aria-hidden={!mobileOpen}
        onClick={onNavigate}
      />
      <aside
        className={cn(
          'border-border/60 bg-card/20 fixed inset-y-0 left-0 z-50 flex flex-col border-r backdrop-blur-md transition-[width,transform] lg:static lg:translate-x-0',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Manager Portal navigation"
      >
        <div className="border-border/60 border-b px-5 py-4">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.24em]">Kōlab</p>
          <h1 className={cn('font-semibold', collapsed ? 'text-sm' : 'text-lg')}>
            {collapsed ? 'MP' : 'Manager Portal'}
          </h1>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Primary">
          {items.map((item, index) => {
            const active = isNavItemActive(pathname, item, items);
            return (
              <Link
                key={item.href}
                ref={(element) => {
                  linkRefs.current[index] = element;
                }}
                href={item.href}
                onClick={onNavigate}
                onKeyDown={(event) => handleKeyDown(event, index)}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  PORTAL_FOCUS_RING_CLASS,
                  active
                    ? 'bg-primary/15 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground',
                  collapsed && 'truncate text-center',
                )}
              >
                {collapsed ? item.label.slice(0, 1) : item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
