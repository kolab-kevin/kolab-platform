import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import type { SettingsGeneralModel } from '@/types/profile-adapters';

type SettingsGeneralSectionProps = {
  general: SettingsGeneralModel | null;
};

export function SettingsGeneralSection({ general }: SettingsGeneralSectionProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">General</CardTitle>
      </CardHeader>
      <CardContent>
        {!general ? (
          <p className="text-muted-foreground text-sm">Account profile unavailable.</p>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-xs">Display name</dt>
              <dd className="mt-1 text-sm">{general.displayName ?? 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Email</dt>
              <dd className="mt-1 text-sm">{general.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Language</dt>
              <dd className="mt-1 text-sm">{general.language}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Time zone</dt>
              <dd className="mt-1 text-sm">{general.timezone}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Country</dt>
              <dd className="mt-1 text-sm">{general.country ?? 'Not set'}</dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
