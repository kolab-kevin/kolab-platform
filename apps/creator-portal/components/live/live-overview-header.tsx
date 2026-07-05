import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import { CampaignStatusBadge } from '@/components/common/campaign-status-badge';
import type { LiveSessionOverviewDisplayModel } from '@/types/live-adapters';

type LiveOverviewHeaderProps = {
  overview: LiveSessionOverviewDisplayModel;
};

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function LiveOverviewHeader({ overview }: LiveOverviewHeaderProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{overview.title ?? 'Live Session'}</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">Live session overview</p>
          </div>
          {overview.status ? <CampaignStatusBadge status={overview.status} /> : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Start time"
          value={overview.startTime ? new Date(overview.startTime).toLocaleString() : '—'}
        />
        <Metric label="Duration" value={formatDuration(overview.durationSeconds)} />
        <Metric label="Current viewers" value={overview.currentViewers?.toLocaleString() ?? '—'} />
        <Metric label="Peak viewers" value={overview.peakViewers?.toLocaleString() ?? '—'} />
        <Metric label="Gift value" value={overview.giftValue ? `$${overview.giftValue}` : '—'} />
        <Metric
          label="Session health"
          value={overview.sessionHealthScore !== null ? `${overview.sessionHealthScore}/100` : '—'}
        />
        <Metric
          label="Last updated"
          value={overview.lastUpdated ? new Date(overview.lastUpdated).toLocaleString() : '—'}
        />
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
