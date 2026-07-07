'use client';

import { APP_ALLOWED_ROLES } from '@kolab/auth';
import { AuthProvider, ErrorBoundary } from '@kolab/ui';

import { OrganizationBridge } from '@/components/organization-bridge';
import { PortalPreferencesProvider } from '@/contexts/portal-preferences-context';
import { authClient } from '@/lib/auth-client';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider authClient={authClient} allowedRoles={[...APP_ALLOWED_ROLES.admin]}>
        <PortalPreferencesProvider>
          <OrganizationBridge>{children}</OrganizationBridge>
        </PortalPreferencesProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
