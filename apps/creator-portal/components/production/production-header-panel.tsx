import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import { CampaignStatusBadge } from '@/components/common/campaign-status-badge';
import {
  formatConnectionStatus,
  formatProductionLabel,
  type ProductionHeaderData,
} from '@/types/production-adapters';

type ProductionHeaderPanelProps = {
  header: ProductionHeaderData;
};

export function ProductionHeaderPanel({ header }: ProductionHeaderPanelProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Production</CardTitle>
        <p className="text-muted-foreground text-xs">
          UI foundation only — OBS and desktop integration intentionally deferred
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-muted-foreground text-xs">Creator</p>
            <p className="text-sm font-medium">{header.creatorDisplayName}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Organization</p>
            <p className="text-sm font-medium">{header.organizationName}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Stream title</p>
            <p className="text-sm">{header.streamTitlePlaceholder}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Scene profile</p>
            <p className="text-sm">{header.sceneProfilePlaceholder}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-muted-foreground mb-1 text-xs">Platform</p>
            <div className="flex flex-wrap gap-2">
              {header.platformOptions.map((platform) => (
                <span
                  key={platform}
                  className={
                    platform === header.selectedPlatform
                      ? 'border-primary/40 bg-primary/10 text-primary rounded-full border px-2.5 py-1 text-xs'
                      : 'text-muted-foreground rounded-full border border-white/10 px-2.5 py-1 text-xs'
                  }
                >
                  {formatProductionLabel(platform)}
                </span>
              ))}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Connection</span>
            <CampaignStatusBadge status={header.connectionStatus} />
            <span className="text-xs">{formatConnectionStatus(header.connectionStatus)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
