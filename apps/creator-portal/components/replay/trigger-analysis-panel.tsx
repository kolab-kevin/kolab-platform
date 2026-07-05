import type { SessionTriggerAnalysisResponse } from '@kolab/types';
import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import { ConfidenceIndicator } from '@/components/common/confidence-indicator';
import {
  formatOffsetMs,
  formatReplayLabel,
  getTriggerEvidenceLines,
} from '@/types/replay-adapters';

type TriggerAnalysisPanelProps = {
  analysis: SessionTriggerAnalysisResponse | null;
};

export function TriggerAnalysisPanel({ analysis }: TriggerAnalysisPanelProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Trigger Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {!analysis || analysis.items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No trigger analysis available.</p>
        ) : (
          <ul className="space-y-3">
            {analysis.items.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm"
              >
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {formatReplayLabel(item.triggerType)}
                    </p>
                  </div>
                  <ConfidenceIndicator score={item.confidenceScore} />
                </div>
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Gift value</dt>
                    <dd>${item.giftValue}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Viewer delta</dt>
                    <dd>{item.viewerDelta ?? '—'}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Window</dt>
                    <dd>
                      {formatOffsetMs(item.windowStartOffsetMs)} –{' '}
                      {formatOffsetMs(item.windowEndOffsetMs)}
                    </dd>
                  </div>
                </dl>
                {getTriggerEvidenceLines(item).length > 0 ? (
                  <ul className="text-muted-foreground mt-3 space-y-1 text-xs">
                    {getTriggerEvidenceLines(item).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : null}
                <p className="mt-3 text-xs text-amber-100">{item.disclaimer}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
