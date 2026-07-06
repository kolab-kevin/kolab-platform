'use client';

import { useAuth } from '@kolab/ui';

import { OrganizationProvider } from '@/contexts/organization-context';

export function OrganizationBridge({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return <OrganizationProvider userEmail={user?.email}>{children}</OrganizationProvider>;
}
