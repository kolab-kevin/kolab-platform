'use client';

import { Button, cn, useAuth } from '@kolab/ui';
import Link from 'next/link';
import * as React from 'react';

import { useOrganization } from '@/contexts/organization-context';
import { PORTAL_FOCUS_RING_CLASS } from '@/lib/portal-ui';

type PortalTopNavProps = {
  onToggleSidebar: () => void;
};

export function PortalTopNav({ onToggleSidebar }: PortalTopNavProps) {
  const { user, logout } = useAuth();
  const { organizations, activeOrganization, setActiveOrganizationId, managerProfile } =
    useOrganization();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-30 border-b backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        <button
          type="button"
          className={cn(
            'text-muted-foreground hover:text-foreground inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 lg:hidden',
            PORTAL_FOCUS_RING_CLASS,
          )}
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          ☰
        </button>

        <div className="hidden min-w-[180px] flex-col sm:flex">
          <span className="text-muted-foreground text-xs">Organization</span>
          <select
            className="bg-background/60 mt-0.5 w-full rounded-md border border-white/10 px-2 py-1 text-sm"
            value={activeOrganization.id}
            onChange={(event) => setActiveOrganizationId(event.target.value)}
            aria-label="Organization selector"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className={cn(
              'text-muted-foreground hover:text-foreground relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10',
              PORTAL_FOCUS_RING_CLASS,
            )}
            aria-label="Notifications (placeholder)"
          >
            🔔
            <span className="bg-primary absolute right-1 top-1 h-2 w-2 rounded-full" />
          </button>

          <div className="relative">
            <button
              type="button"
              className={cn(
                'hover:bg-accent/40 flex items-center gap-2 rounded-md border border-white/10 px-2 py-1.5 text-sm',
                PORTAL_FOCUS_RING_CLASS,
              )}
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span className="bg-primary/20 text-primary flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold">
                {(managerProfile.displayName ?? user?.email ?? 'M').slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden max-w-[120px] truncate md:inline">
                {managerProfile.displayName ?? user?.email}
              </span>
            </button>
            {menuOpen ? (
              <div
                className="border-border/60 bg-card absolute right-0 mt-2 w-48 rounded-lg border py-1 shadow-lg"
                role="menu"
              >
                <div className="text-muted-foreground border-border/60 border-b px-3 py-2 text-xs">
                  {user?.email}
                </div>
                <Link
                  href="/portal/settings"
                  className="hover:bg-accent/40 block px-3 py-2 text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Settings
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn('mx-2 mt-1 w-[calc(100%-1rem)]')}
                  onClick={() => logout()}
                >
                  Log out
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
