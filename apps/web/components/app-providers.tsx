'use client';

import { APP_ALLOWED_ROLES } from '@kolab/auth';
import { AuthProvider, ErrorBoundary } from '@kolab/ui';

import { authClient } from '../lib/auth-client';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider authClient={authClient} allowedRoles={[...APP_ALLOWED_ROLES.web]}>
        {children}
      </AuthProvider>
    </ErrorBoundary>
  );
}
