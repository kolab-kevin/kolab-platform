import type { CreatorIntelligenceProfile } from '@kolab/types';
import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

type CreatorIntelligenceSectionProps = {
  intelligence: CreatorIntelligenceProfile | null;
};

export function CreatorIntelligenceSection({ intelligence }: CreatorIntelligenceSectionProps) {
  if (!intelligence) {
    return (
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-base">Creator Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No creator intelligence profile available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Creator Intelligence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              Overall intelligence score
            </p>
            <p className="mt-1 text-3xl font-bold">
              {intelligence.overallScore}
              <span className="text-muted-foreground text-base font-normal"> / 100</span>
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Trend summary</p>
            <p className="mt-1 text-sm">
              {intelligence.sessionsAnalyzed} sessions analyzed
              {intelligence.dateRange.from && intelligence.dateRange.to
                ? ` · ${new Date(intelligence.dateRange.from).toLocaleDateString()} – ${new Date(intelligence.dateRange.to).toLocaleDateString()}`
                : ''}
            </p>
          </div>
        </div>

        <ListBlock
          title="Top strengths"
          items={intelligence.bestLivePatterns.map((item) => item.label)}
        />
        <ListBlock title="Risk signals" items={intelligence.riskSignals} />
        <ListBlock title="Coaching priorities" items={intelligence.coachingPriorities} />
        <ListBlock title="Recommended next actions" items={intelligence.recommendedNextActions} />
        <ListBlock
          title="Data quality warnings"
          items={intelligence.dataQualityWarnings}
          tone="warning"
        />
      </CardContent>
    </Card>
  );
}

function ListBlock({
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
