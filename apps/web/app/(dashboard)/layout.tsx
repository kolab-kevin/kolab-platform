'use client';

import { SERVICE_NAMES } from '@kolab/config';
import { DashboardShell, useAuth } from '@kolab/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-kolab-muted">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return <DashboardShell appName={SERVICE_NAMES.web}>{children}</DashboardShell>;
}
