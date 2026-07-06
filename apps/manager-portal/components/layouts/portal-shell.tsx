'use client';

import * as React from 'react';

import { GlobalLoading } from '@/components/common/global-loading';
import { PortalBreadcrumbs } from '@/components/layouts/portal-breadcrumbs';
import { PortalSidebar } from '@/components/layouts/portal-sidebar';
import { PortalTopNav } from '@/components/layouts/portal-top-nav';
import { usePortalNavigation } from '@/hooks/use-portal-navigation';

type PortalShellProps = {
  children: React.ReactNode;
};

export function PortalShell({ children }: PortalShellProps) {
  const { navItems, breadcrumbs } = usePortalNavigation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="flex min-h-screen">
        <PortalSidebar
          items={navItems}
          mobileOpen={mobileOpen}
          onNavigate={() => setMobileOpen(false)}
        />
        <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
          <PortalTopNav onToggleSidebar={() => setMobileOpen((open) => !open)} />
          <main className="portal-scrollbar flex-1 px-4 py-5 lg:px-6 lg:py-6">
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
