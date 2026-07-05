import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import { CampaignStatusBadge } from '@/components/common/campaign-status-badge';
import { formatProfileLabel, type PlatformAccountDisplayModel } from '@/types/profile-adapters';

type PlatformAccountsPanelProps = {
  accounts: PlatformAccountDisplayModel[];
};

export function PlatformAccountsPanel({ accounts }: PlatformAccountsPanelProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Platform Accounts</CardTitle>
        <p className="text-muted-foreground text-xs">Connection status only — read-only view</p>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-muted-foreground text-sm">No platform accounts connected.</p>
        ) : (
          <ul className="space-y-3">
            {accounts.map((account) => (
              <li
                key={account.id}
                className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{formatProfileLabel(account.platform)}</p>
                    <p className="text-muted-foreground mt-1 text-xs">@{account.username}</p>
                  </div>
                  <CampaignStatusBadge status={account.connected ? 'ACTIVE' : account.status} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>{formatProfileLabel(account.status)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Verified</dt>
                    <dd>{account.verified ? 'Yes' : 'No'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Followers</dt>
                    <dd>{account.followers?.toLocaleString() ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Connected</dt>
                    <dd>{account.connected ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
