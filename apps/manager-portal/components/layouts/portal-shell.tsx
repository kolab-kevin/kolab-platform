'use client';

import { cn } from '@kolab/ui';
import * as React from 'react';

import { GlobalLoading } from '@/components/common/global-loading';
import { SkipToContentLink } from '@/components/common/skip-to-content-link';
import { PortalBreadcrumbs } from '@/components/layouts/portal-breadcrumbs';
import { PortalSidebar } from '@/components/layouts/portal-sidebar';
import { PortalTopNav } from '@/components/layouts/portal-top-nav';
import { usePortalPreferences } from '@/contexts/portal-preferences-context';
import { usePortalNavigation } from '@/hooks/use-portal-navigation';

type PortalShellProps = {
  children: React.ReactNode;
};

export function PortalShell({ children }: PortalShellProps) {
  const { navItems, breadcrumbs } = usePortalNavigation();
  const { preferences } = usePortalPreferences();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <SkipToContentLink />
      <div className="flex min-h-screen">
        <PortalSidebar
          items={navItems}
          mobileOpen={mobileOpen}
          collapsed={preferences.sidebarCollapsed}
          onNavigate={() => setMobileOpen(false)}
        />
        <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
          <PortalTopNav onToggleSidebar={() => setMobileOpen((open) => !open)} />
          <main
            id="portal-main-content"
            tabIndex={-1}
            className={cn(
              'portal-scrollbar flex-1 px-4 py-5 focus:outline-none lg:px-6 lg:py-6',
              preferences.compactWorkspaces ? 'space-y-4' : undefined,
            )}
          >
            <React.Suspense fallback={<GlobalLoading />}>
              <PortalBreadcrumbs items={breadcrumbs} />
              <div className="mx-auto w-full max-w-7xl">{children}</div>
            </React.Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
