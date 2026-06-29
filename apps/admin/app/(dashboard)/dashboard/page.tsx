'use client';

import { useAuth } from '@kolab/ui';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-kolab-muted mt-2">Welcome to KŌLAB Admin</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-kolab-muted text-sm">Email</dt>
            <dd className="font-medium">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-kolab-muted text-sm">Role</dt>
            <dd className="font-medium">{user?.role}</dd>
          </div>
          <div>
            <dt className="text-kolab-muted text-sm">User ID</dt>
            <dd className="font-mono text-sm">{user?.id}</dd>
          </div>
          <div>
            <dt className="text-kolab-muted text-sm">Platforms</dt>
            <dd className="font-medium">{user?.platforms.join(', ') || 'None'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
