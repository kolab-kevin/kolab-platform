'use client';

import { APP_ALLOWED_ROLES } from '@kolab/auth';
import { AuthProvider, ErrorBoundary } from '@kolab/ui';

import { OrganizationBridge } from '@/components/organization-bridge';
import { ThemeProvider } from '@/contexts/theme-context';
import { authClient } from '@/lib/auth-client';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider authClient={authClient} allowedRoles={[...APP_ALLOWED_ROLES.creatorPortal]}>
          <OrganizationBridge>{children}</OrganizationBridge>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
