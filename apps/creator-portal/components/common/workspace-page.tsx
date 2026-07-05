'use client';

import { Button, cn } from '@kolab/ui';
import type { ReactNode } from 'react';

import {
  EmptyWorkspaceState,
  PartialWorkspaceNotice,
} from '@/components/common/empty-workspace-state';
import { ErrorWorkspaceState } from '@/components/common/workspace-error';
import { InlineLoading } from '@/components/common/workspace-loading';
import { useStudioPreferences } from '@/hooks/use-studio-preferences';
import { WORKSPACE_FOCUS_RING_CLASS, WORKSPACE_PAGE_CLASS } from '@/lib/studio-ui';
import { appendSourceToDescription } from '@/lib/workspace-labels';

type WorkspaceHeaderProps = {
  title: string;
  description?: string;
  source?: string | null;
  actions?: ReactNode;
};

export function WorkspaceHeader({ title, description, source, actions }: WorkspaceHeaderProps) {
  const [preferences] = useStudioPreferences();
  const meta =
    description && preferences.showSourceBadges
      ? appendSourceToDescription(description, source)
      : description;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {meta ? <p className="text-muted-foreground mt-1 text-sm">{meta}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function PanelToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function RefreshWorkspaceButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" className={WORKSPACE_FOCUS_RING_CLASS} onClick={onClick}>
      Refresh
    </Button>
  );
}

type WorkspacePageProps = {
  title: string;
  description?: string;
  source?: string | null;
  loading: boolean;
  loadingLabel?: string;
  error: string | null;
  errorTitle?: string;
  onRetry: () => void;
  actions?: ReactNode;
  emptyNotice?: ReactNode;
  partialNotice?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function WorkspacePage({
  title,
  description,
  source,
  loading,
  loadingLabel,
  error,
  errorTitle = `Unable to load ${title.toLowerCase()}`,
  onRetry,
  actions,
  emptyNotice,
  partialNotice,
  children,
  className,
}: WorkspacePageProps) {
  if (loading) {
    return <InlineLoading label={loadingLabel ?? `Loading ${title.toLowerCase()}…`} />;
  }

  if (error) {
    return <ErrorWorkspaceState title={errorTitle} message={error} onRetry={onRetry} />;
  }

  return (
    <div className={cn(WORKSPACE_PAGE_CLASS, className)}>
      <WorkspaceHeader
        title={title}
        description={description}
        source={source}
        actions={actions ?? <RefreshWorkspaceButton onClick={onRetry} />}
      />
      {emptyNotice}
      {partialNotice}
      {children}
    </div>
  );
}

export { EmptyWorkspaceState, PartialWorkspaceNotice };
