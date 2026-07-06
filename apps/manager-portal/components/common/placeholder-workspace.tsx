'use client';

import { ModulePlaceholder, WorkspacePage } from '@/components/common/workspace-page';

type PlaceholderWorkspaceProps = {
  title: string;
  description: string;
  moduleTitle: string;
  moduleDescription: string;
};

export function PlaceholderWorkspace({
  title,
  description,
  moduleTitle,
  moduleDescription,
}: PlaceholderWorkspaceProps) {
  return (
    <WorkspacePage
      title={title}
      description={description}
      loading={false}
      error={null}
      onRetry={() => undefined}
    >
      <ModulePlaceholder title={moduleTitle} description={moduleDescription} />
    </WorkspacePage>
  );
}
