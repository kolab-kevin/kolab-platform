'use client';

import { hasAnyRole } from '@kolab/auth';
import { AuthClient } from '@kolab/sdk';
import type { Role, UserProfile } from '@kolab/types';
import * as React from 'react';

import { Button } from '../components/ui/button';

export type AuthContextValue = {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export type AuthProviderProps = {
  children: React.ReactNode;
  authClient: AuthClient;
  allowedRoles: Role[];
  onUnauthorized?: () => void;
};

export function AuthProvider({
  children,
  authClient,
  allowedRoles,
  onUnauthorized,
}: AuthProviderProps) {
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refreshUser = React.useCallback(async () => {
    try {
      const token = authClient.getAccessToken();
      if (!token) {
        try {
          const refreshed = await authClient.refresh();
          setUser(refreshed.user);
          setError(null);
          return;
        } catch {
          setUser(null);
          return;
        }
      }

      const profile = await authClient.me();
      if (!hasAnyRole(profile.role, allowedRoles)) {
        setUser(null);
        setError('Your account does not have access to this application');
        onUnauthorized?.();
        return;
      }

      setUser(profile);
      setError(null);
    } catch {
      setUser(null);
    }
  }, [authClient, allowedRoles, onUnauthorized]);

  React.useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setError(null);
    const result = await authClient.login({ email, password });
    if (!hasAnyRole(result.user.role, allowedRoles)) {
      await authClient.logout();
      setError('Your account does not have access to this application');
      throw new Error('Insufficient role for this application');
    }
    setUser(result.user);
  };

  const register = async (email: string, password: string) => {
    setError(null);
    const result = await authClient.register({ email, password });
    if (!hasAnyRole(result.user.role, allowedRoles)) {
      await authClient.logout();
      setError('Registration succeeded but this app requires a different role');
      throw new Error('Insufficient role for this application');
    }
    setUser(result.user);
  };

  const logout = async () => {
    await authClient.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

type DashboardShellProps = {
  appName: string;
  children: React.ReactNode;
};

export function DashboardShell({ appName, children }: DashboardShellProps) {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-lg font-semibold">{appName}</p>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-primary/20 text-primary rounded-full px-3 py-1 text-xs font-medium">
              {user.role}
            </span>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
