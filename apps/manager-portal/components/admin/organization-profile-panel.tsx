import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerOrganizationProfile } from '@/types/administration-workspace';

type OrganizationProfilePanelProps = {
  profile: ManagerOrganizationProfile;
};

export function OrganizationProfilePanel({ profile }: OrganizationProfilePanelProps) {
  const details = [
    { label: 'Contact', value: profile.contactName ?? 'Not configured' },
    { label: 'Phone', value: profile.phone ?? 'Not configured' },
    { label: 'Time zone', value: profile.timezone },
    { label: 'Region', value: profile.region },
    { label: 'Subscription', value: profile.subscriptionTier },
  ];

  return (
    <WorkspaceCard
      title="Organization profile"
      description={profile.logoUrl ? 'Branded agency profile' : 'Agency identity and subscription'}
    >
      <div className="space-y-4">
        <div>
          <div className="text-lg font-semibold">{profile.name}</div>
          {profile.contactEmail ? (
            <div className="text-muted-foreground text-sm">{profile.contactEmail}</div>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {details.map((detail) => (
            <div
              key={detail.label}
              className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3"
            >
              <div className="text-muted-foreground text-xs uppercase tracking-wide">
                {detail.label}
              </div>
              <div className="mt-1 text-sm font-medium">{detail.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {profile.statistics.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3"
            >
              <div className="text-muted-foreground text-xs uppercase tracking-wide">
                {stat.label}
              </div>
              <div className="mt-1 text-lg font-semibold">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </WorkspaceCard>
  );
}
