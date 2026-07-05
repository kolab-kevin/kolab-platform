import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import { CampaignStatusBadge } from '@/components/common/campaign-status-badge';
import {
  formatProductionLabel,
  type ProductionStreamHealthMetrics,
} from '@/types/production-adapters';

type StreamHealthPanelProps = {
  metrics: ProductionStreamHealthMetrics;
};

export function StreamHealthPanel({ metrics }: StreamHealthPanelProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Stream Health</CardTitle>
        <p className="text-muted-foreground text-xs">Mock telemetry only</p>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">CPU</dt>
            <dd>{metrics.cpuUsagePercent}%</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">FPS</dt>
            <dd>{metrics.fps.toFixed(1)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Dropped frames</dt>
            <dd>{metrics.droppedFrames}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Bitrate</dt>
            <dd>{metrics.bitrateKbps.toLocaleString()} kbps</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Latency</dt>
            <dd>{metrics.latencyMs} ms</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Network</dt>
            <dd>{formatProductionLabel(metrics.networkStatus)}</dd>
          </div>
        </dl>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Connection quality</span>
          <CampaignStatusBadge status={metrics.connectionQuality} />
        </div>
      </CardContent>
    </Card>
  );
}
