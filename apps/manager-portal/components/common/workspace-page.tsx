'use client';

import { cn } from '@kolab/ui';
import type { ReactNode } from 'react';

import { GlobalLoading } from '@/components/common/global-loading';
import { ErrorWorkspaceState } from '@/components/common/workspace-error';
import { PORTAL_PAGE_CLASS } from '@/lib/portal-ui';

type WorkspacePageProps = {
  title: string;
  description?: string;
  loading: boolean;
  loadingLabel?: string;
  error: string | null;
  errorTitle?: string;
  onRetry: () => void;
  actions?: ReactNode;
  emptyNotice?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function EmptyWorkspaceState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-100">
      {message}
    </div>
  );
}

export function WorkspacePage({
  title,
  description,
  loading,
  loadingLabel = 'Loading…',
  error,
  errorTitle,
  onRetry,
  actions,
  emptyNotice,
  children,
  className,
}: WorkspacePageProps) {
  return (
    <div className={cn(PORTAL_PAGE_CLASS, className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description ? <p className="text-muted-foreground mt-1 text-sm">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      {loading ? <GlobalLoading label={loadingLabel} /> : null}
      {!loading && error ? (
        <ErrorWorkspaceState title={errorTitle} message={error} onRetry={onRetry} />
      ) : null}
      {!loading && !error && emptyNotice ? emptyNotice : null}
      {!loading && !error ? children : null}
    </div>
  );
}

export function ModulePlaceholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-10 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-sm">
        {description ?? 'This workspace is planned for a future Manager Portal milestone.'}
      </p>
    </div>
  );
}
