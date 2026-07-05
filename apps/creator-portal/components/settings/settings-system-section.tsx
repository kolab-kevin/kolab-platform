import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import { CampaignStatusBadge } from '@/components/common/campaign-status-badge';
import type { SettingsEnvironmentModel } from '@/types/profile-adapters';

type SettingsSystemSectionProps = {
  mockMode: boolean;
  version: string;
  environment: SettingsEnvironmentModel;
};

export function SettingsSystemSection({
  mockMode,
  version,
  environment,
}: SettingsSystemSectionProps) {
  const showEnvironmentDetails = environment.nodeEnv === 'development';

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">System</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm">Data mode</span>
          <CampaignStatusBadge status={mockMode ? 'DRAFT' : 'ACTIVE'} />
          <span className="text-muted-foreground text-xs">
            {mockMode ? 'Mock dashboard data enabled' : 'Live API enabled'}
          </span>
        </div>

        <div>
          <dt className="text-muted-foreground text-xs">Version</dt>
          <dd className="mt-1 text-sm">Creator Studio {version}</dd>
        </div>

        {showEnvironmentDetails ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3">
            <h3 className="mb-2 text-sm font-semibold">Environment</h3>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Node environment</dt>
                <dd>{environment.nodeEnv}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">API base URL</dt>
                <dd className="break-all text-right">{environment.apiBaseUrl}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Creator profile ID</dt>
                <dd className="break-all text-right">{environment.creatorProfileId}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
