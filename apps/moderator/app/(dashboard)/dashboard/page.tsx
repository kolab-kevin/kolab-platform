'use client';

import { useAuth } from '@kolab/ui';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-kolab-muted">Welcome to KŌLAB Moderator</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-kolab-muted">Email</dt>
            <dd className="font-medium">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-kolab-muted">Role</dt>
            <dd className="font-medium">{user?.role}</dd>
          </div>
          <div>
            <dt className="text-sm text-kolab-muted">User ID</dt>
            <dd className="font-mono text-sm">{user?.id}</dd>
          </div>
          <div>
            <dt className="text-sm text-kolab-muted">Platforms</dt>
            <dd className="font-medium">{user?.platforms.join(', ') || 'None'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
