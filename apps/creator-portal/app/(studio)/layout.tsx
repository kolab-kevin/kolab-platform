'use client';

import { useAuth } from '@kolab/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { GlobalLoading } from '@/components/common/global-loading';
import { StudioShell } from '@/components/layouts/studio-shell';

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && error) {
      router.replace('/unauthorized');
    }
  }, [error, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <GlobalLoading />
      </div>
    );
  }

  if (!user || error) {
    return null;
  }

  return <StudioShell>{children}</StudioShell>;
}
