import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import { CampaignStatusBadge } from '@/components/common/campaign-status-badge';
import type { GifterDisplayModel } from '@/types/replay-adapters';
import { formatReplayLabel } from '@/types/replay-adapters';

type GifterIntelligencePanelProps = {
  gifters: GifterDisplayModel[];
  nextCursor: string | null;
};

function GifterCard({ gifter }: { gifter: GifterDisplayModel }) {
  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3 text-sm">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{gifter.displayName}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Relationship tier: {formatReplayLabel(gifter.spendingTier)}
          </p>
        </div>
        <CampaignStatusBadge status={gifter.spendingTier} />
      </div>
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-muted-foreground">Gift count</dt>
          <dd>{gifter.giftCount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Gift total</dt>
          <dd>${gifter.giftValue}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Last gift</dt>
          <dd>{gifter.lastGiftAt ? new Date(gifter.lastGiftAt).toLocaleString() : '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Session contribution</dt>
          <dd>${gifter.sessionContribution}</dd>
        </div>
      </dl>
    </article>
  );
}

function GifterGroup({ title, gifters }: { title: string; gifters: GifterDisplayModel[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {gifters.length === 0 ? (
        <p className="text-muted-foreground text-xs">None</p>
      ) : (
        <ul className="space-y-2">
          {gifters.map((gifter) => (
            <li key={gifter.profileId}>
              <GifterCard gifter={gifter} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function GifterIntelligencePanel({ gifters, nextCursor }: GifterIntelligencePanelProps) {
  const whales = gifters.filter((gifter) => gifter.isWhale);
  const vipSupporters = gifters.filter((gifter) => gifter.isVip);

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Gifter Intelligence</CardTitle>
        <p className="text-muted-foreground text-xs">{gifters.length} gifters</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {gifters.length === 0 ? (
          <p className="text-muted-foreground text-sm">No gifter intelligence available.</p>
        ) : (
          <>
            <GifterGroup title="Top gifters" gifters={gifters.slice(0, 5)} />
            <GifterGroup title="Whales" gifters={whales} />
            <GifterGroup title="VIP supporters" gifters={vipSupporters} />
          </>
        )}
        {nextCursor ? (
          <p className="text-muted-foreground text-xs">
            Additional gifters are available — pagination will load more in a future update.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
