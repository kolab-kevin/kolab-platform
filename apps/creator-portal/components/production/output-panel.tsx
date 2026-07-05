import { Button, Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import { CampaignStatusBadge } from '@/components/common/campaign-status-badge';
import { formatProductionLabel, type ProductionOutputState } from '@/types/production-adapters';

type OutputPanelProps = {
  output: ProductionOutputState;
};

export function OutputPanel({ output }: OutputPanelProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03] xl:h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Output</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="text-muted-foreground rounded-lg border border-dashed border-white/15 bg-black/20 px-3 py-10 text-center text-sm">
            {output.previewLabel}
          </div>
          <div className="text-muted-foreground rounded-lg border border-dashed border-white/15 bg-black/20 px-3 py-10 text-center text-sm">
            {output.outputLabel}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Recording</span>
            <CampaignStatusBadge status={output.recordingStatus} />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Streaming</span>
            <CampaignStatusBadge status={output.streamingStatus} />
          </div>
        </div>

        <p className="text-muted-foreground text-xs">
          Status: {formatProductionLabel(output.streamingStatus)} /{' '}
          {formatProductionLabel(output.recordingStatus)}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button disabled>Start Streaming</Button>
          <Button variant="outline" disabled>
            Stop
          </Button>
          <Button variant="outline" disabled>
            Record
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
