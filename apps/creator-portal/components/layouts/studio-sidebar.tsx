'use client';

import { cn } from '@kolab/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import { readStudioWorkspacePreferences } from '@/lib/studio-preferences';
import { WORKSPACE_FOCUS_RING_CLASS } from '@/lib/studio-ui';
import { isNavItemActive, type StudioNavItem } from '@/types/navigation';

type StudioSidebarProps = {
  items: StudioNavItem[];
  mobileOpen: boolean;
  onNavigate?: () => void;
};

export function StudioSidebar({ items, mobileOpen, onNavigate }: StudioSidebarProps) {
  const pathname = usePathname();
  const [compactSidebar, setCompactSidebar] = React.useState(false);

  React.useEffect(() => {
    setCompactSidebar(readStudioWorkspacePreferences().compactSidebar);

    function handlePreferencesChanged() {
      setCompactSidebar(readStudioWorkspacePreferences().compactSidebar);
    }

    window.addEventListener('studio-preferences-changed', handlePreferencesChanged);
    return () => window.removeEventListener('studio-preferences-changed', handlePreferencesChanged);
  }, []);

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
          'border-border/60 bg-card/20 fixed inset-y-0 left-0 z-50 flex flex-col border-r backdrop-blur-md transition-transform lg:static lg:translate-x-0',
          compactSidebar ? 'w-56' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Creator Studio navigation"
      >
        <div
          className={cn('border-border/60 border-b', compactSidebar ? 'px-4 py-3' : 'px-5 py-4')}
        >
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.24em]">Kōlab</p>
          <h1 className="text-lg font-semibold">Creator Studio</h1>
        </div>
        <nav
          className={cn(
            'flex-1 overflow-y-auto',
            compactSidebar ? 'space-y-0.5 p-2' : 'space-y-1 p-3',
          )}
          aria-label="Primary"
        >
          {items.map((item) => {
            const active = isNavItemActive(pathname, item, items);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'block rounded-lg text-sm font-medium transition-colors',
                  compactSidebar ? 'px-2.5 py-1.5' : 'px-3 py-2',
                  WORKSPACE_FOCUS_RING_CLASS,
                  active
                    ? 'bg-primary/15 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
