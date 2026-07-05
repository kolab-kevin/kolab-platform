import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import { CampaignStatusBadge } from '@/components/common/campaign-status-badge';
import {
  formatLanguageList,
  formatProfileLabel,
  type ProfileDisplayModel,
} from '@/types/profile-adapters';

type CreatorProfilePanelProps = {
  profile: ProfileDisplayModel | null;
};

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}

export function CreatorProfilePanel({ profile }: CreatorProfilePanelProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Creator Profile</CardTitle>
      </CardHeader>
      <CardContent>
        {!profile ? (
          <p className="text-muted-foreground text-sm">No creator profile available.</p>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row">
            <div
              className="bg-primary/10 text-primary flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-semibold"
              style={
                profile.avatarUrl
                  ? {
                      backgroundImage: `url(${profile.avatarUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              {profile.avatarUrl ? null : profile.displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold">{profile.displayName}</p>
                  {profile.username ? (
                    <p className="text-muted-foreground text-sm">@{profile.username}</p>
                  ) : null}
                  <p className="text-muted-foreground mt-1 text-xs">{profile.organizationName}</p>
                </div>
                <CampaignStatusBadge status={profile.status} />
              </div>
              {profile.bio ? <p className="text-sm">{profile.bio}</p> : null}
              <dl className="grid gap-3 sm:grid-cols-2">
                <ProfileField label="Languages" value={formatLanguageList(profile.languages)} />
                <ProfileField label="Country" value={profile.country ?? 'Not set'} />
                <ProfileField label="Time zone" value={profile.timezone ?? 'Not set'} />
                <ProfileField
                  label="Email"
                  value={
                    profile.contact.canViewEmail
                      ? (profile.contact.email ?? 'Not available')
                      : 'Restricted'
                  }
                />
                <ProfileField
                  label="Phone"
                  value={
                    profile.contact.canViewPhone
                      ? (profile.contact.phone ?? 'Not available')
                      : 'Restricted'
                  }
                />
                <ProfileField label="Creator status" value={formatProfileLabel(profile.status)} />
              </dl>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
