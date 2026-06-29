'use client';

import { APP_ALLOWED_ROLES } from '@kolab/auth';
import { AuthProvider } from '@kolab/ui';

import { authClient } from '../lib/auth-client';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider authClient={authClient} allowedRoles={[...APP_ALLOWED_ROLES.creatorPortal]}>
      {children}
    </AuthProvider>
  );
}
