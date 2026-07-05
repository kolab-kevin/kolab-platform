import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import { CampaignStatusBadge } from '@/components/common/campaign-status-badge';
import { formatProductionLabel, type ProductionOverlayItem } from '@/types/production-adapters';

type OverlayManagerPanelProps = {
  overlays: ProductionOverlayItem[];
};

export function OverlayManagerPanel({ overlays }: OverlayManagerPanelProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03] xl:h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Overlay Manager</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {overlays.map((overlay) => (
          <article
            key={overlay.id}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3 text-sm"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{overlay.label}</p>
                <p className="text-muted-foreground text-xs">
                  {formatProductionLabel(overlay.type)}
                </p>
              </div>
              <CampaignStatusBadge status={overlay.status} />
            </div>
            <p className="text-muted-foreground text-xs">
              {overlay.enabled ? 'Enabled' : 'Disabled'} · {overlay.configurationPlaceholder}
            </p>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
