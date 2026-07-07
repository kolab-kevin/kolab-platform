'use client';

import type { ReactNode } from 'react';

import { EmptyWorkspaceState, WorkspacePage } from '@/components/common/workspace-page';
import { WorkspaceRefreshButton } from '@/components/common/workspace-toolbar';
import { appendDataSourceSuffix } from '@/lib/data-source';
import type { WorkspaceDataSource } from '@/types/data-source';

type WorkspaceDataPageProps = {
  title: string;
  fallbackDescription: string;
  loadedDescription?: string;
  loading: boolean;
  loadingLabel: string;
  error: string | null;
  errorTitle: string;
  source: WorkspaceDataSource | null;
  sources?: Array<WorkspaceDataSource | null>;
  emptyMessage: string;
  onRefresh: () => void;
  children: ReactNode;
};

export function WorkspaceDataPage({
  title,
  fallbackDescription,
  loadedDescription,
  loading,
  loadingLabel,
  error,
  errorTitle,
  source,
  sources,
  emptyMessage,
  onRefresh,
  children,
}: WorkspaceDataPageProps) {
  const description = loadedDescription
    ? appendDataSourceSuffix(loadedDescription, source ?? undefined)
    : fallbackDescription;

  return (
    <WorkspacePage
      title={title}
      description={description}
      loading={loading}
      loadingLabel={loadingLabel}
      error={error}
      errorTitle={errorTitle}
      onRetry={() => void onRefresh()}
      actions={<WorkspaceRefreshButton onRefresh={onRefresh} />}
      emptyNotice={
        source === 'empty' || sources?.includes('empty') ? (
          <EmptyWorkspaceState message={emptyMessage} />
        ) : null
      }
    >
      {children}
    </WorkspacePage>
  );
}
