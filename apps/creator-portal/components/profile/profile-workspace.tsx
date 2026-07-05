'use client';

import { EmptyWorkspaceState } from '@/components/common/empty-workspace-state';
import { PartialWorkspaceNotice, WorkspacePage } from '@/components/common/workspace-page';
import { CompliancePanel } from '@/components/profile/compliance-panel';
import { CreatorProfilePanel } from '@/components/profile/creator-profile-panel';
import { PlatformAccountsPanel } from '@/components/profile/platform-accounts-panel';
import { SkillsCategoriesPanel } from '@/components/profile/skills-categories-panel';
import { useProfileWorkspace } from '@/hooks/use-profile-workspace';
import { WORKSPACE_GRID_CLASS } from '@/lib/studio-ui';

export function ProfileWorkspace() {
  const { data, loading, error, source, refresh } = useProfileWorkspace();

  return (
    <WorkspacePage
      title="Profile"
      description={data.profile?.displayName ?? 'Creator profile'}
      source={source}
      loading={loading}
      loadingLabel="Loading profile workspace…"
      error={error}
      errorTitle="Unable to load profile workspace"
      onRetry={() => void refresh()}
      emptyNotice={
        source === 'empty' ? (
          <EmptyWorkspaceState message="No profile data is available yet. Complete onboarding to populate this workspace." />
        ) : null
      }
      partialNotice={
        source === 'partial' ? (
          <PartialWorkspaceNotice message="Some profile sections could not be loaded. Showing available results." />
        ) : null
      }
    >
      <CreatorProfilePanel profile={data.profile} />

      <div className={WORKSPACE_GRID_CLASS}>
        <PlatformAccountsPanel accounts={data.platformAccounts} />
        <SkillsCategoriesPanel skills={data.skills} />
      </div>

      <CompliancePanel compliance={data.compliance} />
    </WorkspacePage>
  );
}
