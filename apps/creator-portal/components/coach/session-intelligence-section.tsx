import type { SessionIntelligenceSnapshot } from '@kolab/types';
import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import { ProgressBar } from '@/components/common/progress-bar';

type SessionIntelligenceSectionProps = {
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

export function SessionIntelligenceSection({ intelligence }: SessionIntelligenceSectionProps) {
  if (!intelligence) {
    return (
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-base">Intelligence Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No session intelligence snapshot available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Intelligence Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Overall score</p>
          <p className="mt-1 text-3xl font-bold">
            {intelligence.overallScore}
            <span className="text-muted-foreground text-base font-normal"> / 100</span>
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ScoreRow label="Session health" value={intelligence.sessionHealthScore} />
          <ScoreRow label="Revenue" value={intelligence.revenueScore} />
          <ScoreRow label="Engagement" value={intelligence.engagementScore} />
          <ScoreRow label="Consistency" value={intelligence.consistencyScore} />
          <ScoreRow label="Gifter quality" value={intelligence.gifterQualityScore} />
          <ScoreRow label="Coaching opportunity" value={intelligence.coachingOpportunityScore} />
        </div>

        <NarrativeBlock title="Key strengths" items={intelligence.keyStrengths} />
        <NarrativeBlock title="Key risks" items={intelligence.keyRisks} />
        <NarrativeBlock
          title="Recommended next actions"
          items={intelligence.recommendedNextActions}
        />
        <NarrativeBlock
          title="Data quality warnings"
          items={intelligence.dataQualityWarnings}
          tone="warning"
        />
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
