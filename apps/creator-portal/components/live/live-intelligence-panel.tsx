import type { SessionIntelligenceSnapshot } from '@kolab/types';
import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import { ProgressBar } from '@/components/common/progress-bar';

type LiveIntelligencePanelProps = {
  intelligence: SessionIntelligenceSnapshot | null;
};

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{value}/100</span>
      </div>
      <ProgressBar percent={value} />
    </div>
  );
}

export function LiveIntelligencePanel({ intelligence }: LiveIntelligencePanelProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03] lg:min-h-[520px] lg:overflow-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Live Intelligence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {!intelligence ? (
          <p className="text-muted-foreground text-sm">No live intelligence snapshot available.</p>
        ) : (
          <>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Session score</p>
              <p className="mt-1 text-3xl font-bold">
                {intelligence.overallScore}
                <span className="text-muted-foreground text-base font-normal"> / 100</span>
              </p>
            </div>

            <div className="grid gap-4">
              <ScoreRow label="Revenue" value={intelligence.revenueScore} />
              <ScoreRow label="Engagement" value={intelligence.engagementScore} />
              <ScoreRow label="Consistency" value={intelligence.consistencyScore} />
              <ScoreRow label="Gifter quality" value={intelligence.gifterQualityScore} />
            </div>

            <NarrativeBlock
              title="Recommended actions"
              items={intelligence.recommendedNextActions}
            />
            <NarrativeBlock title="Strengths" items={intelligence.keyStrengths} />
            <NarrativeBlock title="Risks" items={intelligence.keyRisks} />
            <NarrativeBlock
              title="Data quality warnings"
              items={intelligence.dataQualityWarnings}
              tone="warning"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function NarrativeBlock({
  title,
  items,
  tone = 'default',
}: {
  title: string;
  items: string[];
  tone?: 'default' | 'warning';
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">None recorded.</p>
      ) : (
        <ul
          className={
            tone === 'warning'
              ? 'space-y-1 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm'
              : 'space-y-1 text-sm'
          }
        >
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
