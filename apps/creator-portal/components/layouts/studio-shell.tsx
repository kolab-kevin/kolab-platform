'use client';

import * as React from 'react';

import { GlobalLoading } from '@/components/common/global-loading';
import { StudioBreadcrumbs } from '@/components/layouts/studio-breadcrumbs';
import { StudioSidebar } from '@/components/layouts/studio-sidebar';
import { StudioTopNav } from '@/components/layouts/studio-top-nav';
import { useStudioNavigation } from '@/hooks/use-studio-navigation';

type StudioShellProps = {
  children: React.ReactNode;
};

export function StudioShell({ children }: StudioShellProps) {
  const { navItems, breadcrumbs } = useStudioNavigation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="flex min-h-screen">
        <StudioSidebar
          items={navItems}
          mobileOpen={mobileOpen}
          onNavigate={() => setMobileOpen(false)}
        />
        <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
          <StudioTopNav onToggleSidebar={() => setMobileOpen((open) => !open)} />
          <main className="studio-scrollbar flex-1 px-4 py-5 lg:px-6 lg:py-6">
            <React.Suspense fallback={<GlobalLoading />}>
              <StudioBreadcrumbs items={breadcrumbs} />
              <div className="mx-auto w-full max-w-7xl">{children}</div>
            </React.Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
