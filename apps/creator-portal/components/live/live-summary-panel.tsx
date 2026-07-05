import type { LiveSessionSummaryResponse } from '@kolab/types';
import { Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

type LiveSummaryPanelProps = {
  summary: LiveSessionSummaryResponse | null;
};

export function LiveSummaryPanel({ summary }: LiveSummaryPanelProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03] lg:min-h-[520px] lg:resize-x lg:overflow-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Session Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {!summary ? (
          <p className="text-muted-foreground text-sm">No session summary available.</p>
        ) : (
          <>
            <SummaryList
              title="Top moments"
              items={summary.topMoments.map((item) => item.label)}
              emptyMessage="No top moments recorded."
            />
            <SummaryList
              title="Top gift events"
              items={summary.topGiftEvents.map(
                (item) =>
                  `${item.actorDisplayName ?? 'Anonymous'} · ${item.giftCount} gifts · $${item.giftValue}`,
              )}
              emptyMessage="No top gift events recorded."
            />
            <SummaryList
              title="Top gifters"
              items={summary.topGifters.map(
                (item) => `${item.displayName ?? 'Anonymous'} · $${item.giftValue}`,
              )}
              emptyMessage="No top gifters recorded."
            />
            <SummaryList
              title="Trigger summary"
              items={
                summary.triggerSummary
                  ? [
                      `${summary.triggerSummary.totalTriggers} triggers`,
                      ...summary.triggerSummary.topTriggerTypes.map(
                        (item) => `${item.triggerType}: ${item.count}`,
                      ),
                    ]
                  : []
              }
              emptyMessage="No trigger summary available."
            />
            <SummaryList
              title="Coaching notes"
              items={summary.coachingNotes}
              emptyMessage="No coaching notes recorded."
            />
            <SummaryList
              title="Compliance warnings"
              items={summary.complianceWarnings}
              emptyMessage="No compliance warnings."
              tone="warning"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryList({
  title,
  items,
  emptyMessage,
  tone = 'default',
}: {
  title: string;
  items: string[];
  emptyMessage: string;
  tone?: 'default' | 'warning';
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
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
