'use client';

import { Button } from '@kolab/ui';

import { InlineLoading } from '@/components/common/global-loading';
import { WorkspaceError } from '@/components/common/workspace-error';
import { CompliancePanel } from '@/components/profile/compliance-panel';
import { CreatorProfilePanel } from '@/components/profile/creator-profile-panel';
import { PlatformAccountsPanel } from '@/components/profile/platform-accounts-panel';
import { SkillsCategoriesPanel } from '@/components/profile/skills-categories-panel';
import { useProfileWorkspace } from '@/hooks/use-profile-workspace';

function sourceLabel(
  source: NonNullable<ReturnType<typeof useProfileWorkspace>['source']>,
): string {
  switch (source) {
    case 'mock':
      return 'Mock data';
    case 'live':
      return 'Live API';
    case 'empty':
      return 'No profile data yet';
    case 'partial':
      return 'Partial API data';
    default:
      return source;
  }
}

export function ProfileWorkspace() {
  const { data, loading, error, source, refresh } = useProfileWorkspace();

  if (loading) {
    return <InlineLoading label="Loading profile workspace…" />;
  }

  if (error) {
    return (
      <WorkspaceError
        title="Unable to load profile workspace"
        message={error}
        onRetry={() => void refresh()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground text-sm">
            {data.profile?.displayName ?? 'Creator profile'}
            {source ? ` · ${sourceLabel(source)}` : null}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>

      {source === 'empty' ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          No profile data is available yet. Complete onboarding to populate this workspace.
        </div>
      ) : null}

      {source === 'partial' ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Some profile sections could not be loaded. Showing available results.
        </div>
      ) : null}

      <CreatorProfilePanel profile={data.profile} />

      <div className="grid gap-4 xl:grid-cols-2">
        <PlatformAccountsPanel accounts={data.platformAccounts} />
        <SkillsCategoriesPanel skills={data.skills} />
      </div>

      <CompliancePanel compliance={data.compliance} />
    </div>
  );
}
