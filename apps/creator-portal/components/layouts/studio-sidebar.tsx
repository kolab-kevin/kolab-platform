'use client';

import { cn } from '@kolab/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { StudioNavItem } from '@/types/navigation';

type StudioSidebarProps = {
  items: StudioNavItem[];
  mobileOpen: boolean;
  onNavigate?: () => void;
};

export function StudioSidebar({ items, mobileOpen, onNavigate }: StudioSidebarProps) {
  const pathname = usePathname();

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
          'border-border/60 bg-card/20 fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r backdrop-blur-md transition-transform lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="border-border/60 border-b px-5 py-4">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.24em]">Kōlab</p>
          <h1 className="text-lg font-semibold">Creator Studio</h1>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Creator Studio">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/15 text-primary'
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
