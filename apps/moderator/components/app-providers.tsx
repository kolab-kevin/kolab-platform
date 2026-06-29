'use client';

import { AuthProvider } from '@kolab/ui';
import { APP_ALLOWED_ROLES } from '@kolab/auth';
import { authClient } from '../lib/auth-client';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider authClient={authClient} allowedRoles={[...APP_ALLOWED_ROLES.moderator]}>
      {children}
    </AuthProvider>
  );
}
